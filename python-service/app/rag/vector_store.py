import os
import json
import math
import re
from typing import List, Dict, Any, Optional
from app.rag.schema import KnowledgeDocument, RetrievalResult

class LocalVectorStore:
    """
    A lightweight, robust local vector and semantic retrieval engine.
    Supports exact concept keyword routing, BM25/Cosine token matching,
    and strict relevance filtering to prevent false positive hallucinations.
    """
    def __init__(self, kb_dir: Optional[str] = None):
        if not kb_dir:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            kb_dir = os.path.join(base_dir, "knowledge_base")
        self.kb_dir = kb_dir
        self.documents: List[KnowledgeDocument] = []
        self.doc_vectors: List[Dict[str, float]] = []
        self.idf: Dict[str, float] = {}
        self.load_all_documents()

    VI_STOPWORDS = {
        "bạn", "có", "thể", "giúp", "tôi", "không", "được", "là", "và", "của", "cho",
        "với", "nhé", "nào", "này", "đó", "thế", "sao", "làm", "gì", "đi", "ơi", "ạ",
        "muốn", "hỏi", "1", "một", "số", "về", "các", "những", "cái", "hay", "chút",
        "can", "you", "help", "me", "please", "i", "a", "an", "the", "what", "is", "how", "to"
    }

    # Strict Concept Keyword Registry to ensure 100% precision on trading terms
    CONCEPT_KEYWORDS = {
        "ict_001": ["fvg", "fair value gap", "khoảng trống", "imbalance", "mất cân bằng"],
        "ict_002": ["liquidity", "thanh khoản", "bsl", "ssl", "buy side", "sell side", "buy-side", "sell-side", "quét thanh khoản", "sweep", "raid", "equal high", "equal low", "eqh", "eql", "turtle soup", "sfp", "purge", "erl", "irl"],
        "ict_003": ["order block", "ob", "breaker", "breaker block", "khối lệnh"],
        "ict_004": ["market structure shift", "mss", "bos", "break of structure", "chuyển dịch cấu trúc"],
        "ict_005": ["ote", "optimal trade entry", "fibonacci", "fibo", "discount", "premium", "equilibrium"],
    "ict_006": ["erl", "irl", "external range liquidity", "internal range liquidity", "ipda", "draw on liquidity"],
    "ict_007": ["inducement", "idm", "smt", "smt divergence", "phân kỳ", "dụ dỗ"],
        "pa_001": ["higher high", "higher low", "cấu trúc thị trường", "market structure", "hh", "hl", "downtrend", "uptrend", "đỉnh đáy"],
        "pa_002": ["breakout", "retest", "pullback", "hỗ trợ", "kháng cự", "support", "resistance", "thoái lui", "vượt cản"],
        "pa_003": ["pinbar", "rejection", "từ chối giá", "false breakout", "bull trap", "bear trap", "bẫy giá", "râu nến", "shooting star", "hammer"],
        "rm_001": ["quản trị rủi ro", "quản lý vốn", "position size", "khối lượng", "1%", "2%", "1%-2%", "dừng lỗ", "stop loss", "cắt lỗ", "invalidation"],
        "rm_002": ["risk reward", "r:r", "rr", "tỷ lệ rr", "win rate", "expectancy", "kỳ vọng toán học", "chốt lời", "take profit", "tp"],
        "rm_003": ["mae", "mfe", "excursion", "drawdown", "chốt non", "gồng lãi"],
        "psy_001": ["fomo", "revenge", "trả thù", "cay cú", "tâm lý", "sợ bỏ lỡ", "kỷ luật", "cool-down"],
        "psy_002": ["dời stop loss", "moving stop loss", "nới stop loss", "phá vỡ kỷ luật", "rule breaking"],
        "psy_003": ["nhật ký", "trading journal", "journal", "ghi chép", "process over outcome"]
    }

    def _tokenize(self, text: str, filter_stop: bool = False) -> List[str]:
        cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = cleaned.split()
        if filter_stop:
            tokens = [t for t in tokens if t not in self.VI_STOPWORDS]
        # Add bigrams for trading terminology
        bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens)-1)]
        return tokens + bigrams

    def load_all_documents(self):
        self.documents = []
        if not os.path.exists(self.kb_dir):
            return

        for root, _, files in os.walk(self.kb_dir):
            for file in files:
                if file.endswith(".json"):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                for item in data:
                                    self.documents.append(KnowledgeDocument(**item))
                            elif isinstance(data, dict):
                                self.documents.append(KnowledgeDocument(**data))
                    except Exception as e:
                        print(f"Error loading KB file {filepath}: {e}")

        N = len(self.documents)
        if N == 0:
            return

        df: Dict[str, int] = {}
        for doc in self.documents:
            full_text = f"{doc.title} {doc.concept} {doc.framework} {' '.join(doc.tags)} {doc.content}"
            tokens = set(self._tokenize(full_text))
            for token in tokens:
                df[token] = df.get(token, 0) + 1

        self.idf = {token: math.log((N + 1) / (count + 0.5)) + 1 for token, count in df.items()}

        self.doc_vectors = []
        for doc in self.documents:
            full_text = f"{doc.title} {doc.concept} {doc.framework} {' '.join(doc.tags)} {doc.content}"
            tokens = self._tokenize(full_text)
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1.0

            vec = {}
            norm_sq = 0.0
            for t, val in tf.items():
                w = val * self.idf.get(t, 1.0)
                vec[t] = w
                norm_sq += w * w
            norm = math.sqrt(norm_sq) or 1.0
            for t in vec:
                vec[t] /= norm
            self.doc_vectors.append(vec)

    def search(
        self,
        query: str,
        top_k: int = 3,
        framework: Optional[str] = None,
        source_type: Optional[str] = None
    ) -> List[RetrievalResult]:
        if not self.documents:
            return []

        clean_lower = query.lower()

        # Step 1: Exact concept keyword routing (Highest precision)
        matched_docs = []
        for doc_id, kws in self.CONCEPT_KEYWORDS.items():
            for kw in kws:
                # Word boundary match
                pattern = r'(?:\b|_)' + re.escape(kw) + r'(?:\b|_)'
                if re.search(pattern, clean_lower):
                    target_doc = next((d for d in self.documents if d.id == doc_id), None)
                    if target_doc and target_doc not in [m[0] for m in matched_docs]:
                        matched_docs.append((target_doc, 0.95))
                    break

        if matched_docs:
            results = []
            for doc, score in matched_docs[:top_k]:
                if framework and doc.framework.upper() != framework.upper():
                    continue
                if source_type and doc.sourceType.upper() != source_type.upper():
                    continue
                citation = f"[{doc.sourceType}] Nguồn: {doc.source} | Tác giả: {doc.author} | Link: {doc.sourceUrl}"
                results.append(RetrievalResult(document=doc, score=score, citationText=citation))
            if results:
                return results

        # Step 2: Semantic vector cosine search with strict threshold
        q_tokens = self._tokenize(query, filter_stop=True)
        if not q_tokens:
            return []

        q_tf: Dict[str, float] = {}
        for t in q_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1.0

        q_vec = {}
        norm_sq = 0.0
        for t, val in q_tf.items():
            w = val * self.idf.get(t, 1.0)
            q_vec[t] = w
            norm_sq += w * w
        norm = math.sqrt(norm_sq) or 1.0
        for t in q_vec:
            q_vec[t] /= norm

        results = []
        for idx, (doc, d_vec) in enumerate(zip(self.documents, self.doc_vectors)):
            if framework and doc.framework.upper() != framework.upper():
                continue
            if source_type and doc.sourceType.upper() != source_type.upper():
                continue

            score = 0.0
            for t, qw in q_vec.items():
                if t in d_vec:
                    score += qw * d_vec[t]

            if doc.sourceType == "PRIMARY":
                score *= 1.15

            # STRICT threshold: Require at least 0.35 to avoid matching random conversational text
            if score >= 0.35:
                citation = f"[{doc.sourceType}] Nguồn: {doc.source} | Tác giả: {doc.author} | Link: {doc.sourceUrl}"
                results.append(RetrievalResult(document=doc, score=round(score, 4), citationText=citation))

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]

# Global singleton vector store instance (reloaded)
vector_store = LocalVectorStore()

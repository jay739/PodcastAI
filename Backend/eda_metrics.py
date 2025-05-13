from collections import Counter
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk; nltk.download("vader_lexicon", quiet=True)

def generate_word_frequencies(text: str, top_n: int = 50):
    import re
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    stopwords = {
        "this", "that", "with", "from", "were", "have", "which", "about",
        "the", "and", "for", "then", "than", "however", "into", "onto", "until", "also"
    }
    filtered = [w for w in words if w not in stopwords]
    freq = Counter(filtered)
    return freq.most_common(top_n)

def analyze_sentiment_by_chunk(chunks):
    analyzer = SentimentIntensityAnalyzer()
    return [analyzer.polarity_scores(chunk)["compound"] for chunk in chunks]

def get_topic_model(chunks, n_topics=5):
    try:
        from bertopic import BERTopic
        model = BERTopic()
        topics, _ = model.fit_transform(chunks)
        topic_data = model.get_topics()
        simplified = {}
        for k, v in topic_data.items():
            simplified[k] = [{"word": word, "weight": weight} for word, weight in v]
        return simplified
    except Exception:
        return fallback_lda_topics(chunks, n_topics)

def fallback_lda_topics(chunks, n_topics=5):
    from gensim import corpora, models
    texts = [chunk.split() for chunk in chunks]
    dictionary = corpora.Dictionary(texts)
    corpus = [dictionary.doc2bow(text) for text in texts]
    lda = models.LdaModel(corpus, id2word=dictionary, num_topics=n_topics, passes=10)
    topics = lda.show_topics(num_topics=n_topics, formatted=False)
    simplified = {}
    for idx, topic in topics:
        simplified[idx] = [{"word": w, "weight": float(wt)} for wt, w in topic]
    return simplified

import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from textblob import TextBlob
import yfinance as yf
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error


import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')


def get_articles(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    articles = soup.find_all('article')
    data = []
    for article in articles:
        headline = article.find('h3').text if article.find('h3') else 'No headline'
        date = article.find('time')['datetime'] if article.find('time') else 'No date'
        content = article.find('div', class_='body-copy').text if article.find('div', class_='body-copy') else 'No content'
        data.append({'headline': headline, 'date': date, 'content': content})
    return data


def preprocess_text(text):
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = text.lower()
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stopwords.words('english')]
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)


def get_sentiment(text):
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    return polarity


def get_stock_data(ticker, start_date, end_date):
    stock_data = yf.download(ticker, start=start_date, end=end_date)
    return stock_data


def plot_sentiment_vs_stock_price(stock_data, sentiment_data):
    plt.figure(figsize=(14, 7))
    plt.plot(stock_data['Close'], label='Stock Price')
    plt.plot(sentiment_data['sentiment'], label='Sentiment', linestyle='--')
    plt.legend()
    plt.show()


def train_model(stock_data, sentiment_data):
    X = sentiment_data[['sentiment']]
    y = stock_data['Close']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    return model, mse


url = 'https://www.bloomberg.com/markets'
articles = get_articles(url)


print("Sample Articles:", articles[:5])

for article in articles:
    article['content'] = preprocess_text(article['content'])
    article['sentiment'] = get_sentiment(article['content'])
    
sentiment_data = pd.DataFrame(articles)
print("Sentiment Data DataFrame before filtering:", sentiment_data.head())
sentiment_data = sentiment_data[sentiment_data['date'] != 'No date']
sentiment_data = sentiment_data[sentiment_data['content'] != 'No content']
print("Filtered Sentiment Data DataFrame:", sentiment_data.head())
sentiment_data['date'] = pd.to_datetime(sentiment_data['date'])
sentiment_data = sentiment_data.groupby(sentiment_data['date'].dt.date).mean()
ticker = 'AAPL'
start_date = '2023-01-01'
end_date = '2023-12-31'
stock_data = get_stock_data(ticker, start_date, end_date)
sentiment_data = sentiment_data.reindex(stock_data.index)
plot_sentiment_vs_stock_price(stock_data, sentiment_data)
model, mse = train_model(stock_data, sentiment_data)
print(f"Mean Squared Error: {mse}")

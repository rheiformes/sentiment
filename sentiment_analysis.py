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

# Download NLTK data
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Step 1: Web Scraping Function
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

# Step 2: Text Preprocessing Function
def preprocess_text(text):
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = text.lower()
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stopwords.words('english')]
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)

# Step 3: Sentiment Analysis Function
def get_sentiment(text):
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    return polarity

# Step 4: Get Stock Data Function
def get_stock_data(ticker, start_date, end_date):
    stock_data = yf.download(ticker, start=start_date, end=end_date)
    return stock_data

# Step 5: Plotting Function
def plot_sentiment_vs_stock_price(stock_data, sentiment_data):
    plt.figure(figsize=(14, 7))
    plt.plot(stock_data['Close'], label='Stock Price')
    plt.plot(sentiment_data['sentiment'], label='Sentiment', linestyle='--')
    plt.legend()
    plt.show()

# Step 6: Train Model Function
def train_model(stock_data, sentiment_data):
    X = sentiment_data[['sentiment']]
    y = stock_data['Close']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    return model, mse

# Example usage
url = 'https://www.bloomberg.com/markets'
articles = get_articles(url)

for article in articles:
    article['content'] = preprocess_text(article['content'])
    article['sentiment'] = get_sentiment(article['content'])

# Convert to DataFrame
sentiment_data = pd.DataFrame(articles)

# Filter out articles with no date or content
sentiment_data = sentiment_data[sentiment_data['date'] != 'No date']
sentiment_data = sentiment_data[sentiment_data['content'] != 'No content']

# Convert date to datetime
sentiment_data['date'] = pd.to_datetime(sentiment_data['date'])

# Group by date and average sentiment
sentiment_data = sentiment_data.groupby(sentiment_data['date'].dt.date).mean()

# Get stock data for a specific ticker and date range
ticker = 'AAPL'
start_date = '2023-01-01'
end_date = '2023-12-31'
stock_data = get_stock_data(ticker, start_date, end_date)

# Align sentiment data with stock data
sentiment_data = sentiment_data.reindex(stock_data.index)

# Plot sentiment vs. stock price
plot_sentiment_vs_stock_price(stock_data, sentiment_data)

# Train and evaluate the model
model, mse = train_model(stock_data, sentiment_data)
print(f"Mean Squared Error: {mse}")

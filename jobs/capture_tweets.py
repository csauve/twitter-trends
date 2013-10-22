# runtime usage:
# python capture_tweets.py <sentiment_file> <duration_sec> <node_api> <count_threshold>

import oauth2 as oauth
import urllib2 as urllib
import datetime
import sys
import json
import re

# twitter API and auth setup
access_token_key = ""
access_token_secret = ""
consumer_key = ""
consumer_secret = ""
oauth_token = oauth.Token(key=access_token_key, secret=access_token_secret)
oauth_consumer = oauth.Consumer(key=consumer_key, secret=consumer_secret)
signature_method_hmac_sha1 = oauth.SignatureMethod_HMAC_SHA1()
http_method = "GET"
_debug = 0
http_handler  = urllib.HTTPHandler(debuglevel=_debug)
https_handler = urllib.HTTPSHandler(debuglevel=_debug)

# globals
sentiment_scores = {}
hashtag_data = {}

#build the sentiment dictionary
def load_scores(scores_file):
  for line in scores_file:
    term, score = line.split("\t")
    sentiment_scores[str(term)] = int(score)

# Construct, sign, and open a twitter request using the hard-coded credentials above
def twitterreq(url, method, parameters):
  req = oauth.Request.from_consumer_and_token(oauth_consumer,
                                             token=oauth_token,
                                             http_method=http_method,
                                             http_url=url, 
                                             parameters=parameters)
  req.sign_request(signature_method_hmac_sha1, oauth_consumer, oauth_token)
  headers = req.to_header()
  if http_method == "POST":
    encoded_post_data = req.to_postdata()
  else:
    encoded_post_data = None
    url = req.to_url()
  opener = urllib.OpenerDirector()
  opener.add_handler(http_handler)
  opener.add_handler(https_handler)
  response = opener.open(url, encoded_post_data)
  return response

def handle_tweet(tweet_json):
  try:
    tweet = json.loads(tweet_json)

    #ignore non-tweets and tweets without captured hashtags
    if "text" not in tweet or "entities" not in tweet or tweet["entities"] == None:
      return
    if "lang" not in tweet or tweet["lang"] != "en":
      return

    #calculate sentiment for the tweet
    text = tweet["text"]
    sentiment_sum = 0.0
    for term in re.split(r'\s+|\.|\,|\!|\#|\"|\*', text):
        if term.lower() in sentiment_scores:
            sentiment_sum += sentiment_scores[term.lower()]

    sharing_sum = 0.0
    if "retweet_count" in tweet:
      sharing_sum += float(tweet["retweet_count"])
    if "in_reply_to_status_id" in tweet:
      sharing_sum += 1.0

    #keep track of scores for the hashtags in this tweet
    hashtags = tweet["entities"]["hashtags"]
    for hashtag in hashtags:
      hashtag_name = hashtag["text"].lower()
      if hashtag_name not in hashtag_data:
        hashtag_data[hashtag_name] = [sentiment_sum, sharing_sum, 1]
      else:
        hashtag_data[hashtag_name][0] += sentiment_sum
        hashtag_data[hashtag_name][1] += sharing_sum
        hashtag_data[hashtag_name][2] += 1
  #mainly handle parsing errors
  except:
      return

def post_results(node_api, count_threshold):
  for hashtag_name in hashtag_data:
    sentiment_sum = hashtag_data[hashtag_name][0]
    sharing_sum = hashtag_data[hashtag_name][1]
    count = hashtag_data[hashtag_name][2]

    if count < count_threshold:
      continue

    data = {
      "hashtag": hashtag_name,
      "popularityIndex": count,
      "sentimentIndex": float(sentiment_sum) / float(count),
      "sharingIndex": float(sharing_sum) / float(count)
    }
    req = urllib.Request(node_api)
    req.add_header('Content-Type', 'application/json')
    response = urllib.urlopen(req, json.dumps(data))

# calculate sentiment, sharing index, and popularity for each hashtag,
# then post it all to the node.js API
def main():
  # load word sentiments
  print "loading sentiment scores"
  sentiments_file = open(sys.argv[1])
  load_scores(sentiments_file)

  # handle the stream of tweets from the twitter API
  print "capturing tweets"
  duration_sec = int(sys.argv[2])
  start = datetime.datetime.now()
  response = twitterreq("https://stream.twitter.com/1/statuses/sample.json", "GET", [])
  for line in response:
    now  = datetime.datetime.now()
    elapsed_seconds = (now - start).total_seconds()
    if elapsed_seconds > duration_sec:
      break;
    handle_tweet(line.strip())

  # generate our final results and post them to the node.js API
  print "posting results"
  post_results(sys.argv[3], int(sys.argv[4]))

if __name__ == '__main__':
  main()

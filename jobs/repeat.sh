#!/bin/bash

duration_sec=600
threshold=10

while true
do
    echo "RUNNING: $duration_sec seconds at threshold $threshold"
    python capture_tweets.py sentiments.txt $duration_sec "http://localhost:8080/api/snapshots" $threshold
done

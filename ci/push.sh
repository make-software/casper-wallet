#!/bin/bash

max_retry=5
counter=0
until git push origin master
do
   sleep 3
   [[ counter -eq $max_retry ]] && echo "Failed job!" && exit 1
   echo "Trying again. Try #$counter" && git pull origin master
   ((counter++))
done
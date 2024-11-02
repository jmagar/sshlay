#!/bin/bash

case "$1" in
  "start")
    docker-compose up -d mongodb
    echo "MongoDB container started"
    ;;
  "stop")
    docker-compose stop mongodb
    echo "MongoDB container stopped"
    ;;
  "restart")
    docker-compose restart mongodb
    echo "MongoDB container restarted"
    ;;
  "logs")
    docker-compose logs -f mongodb
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs}"
    exit 1
    ;;
esac

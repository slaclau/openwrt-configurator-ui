#!/bin/sh

. /usr/share/libubox/jshn.sh

send_heartbeat() {
  json_init
  json_add_string "hostname" "$(uci get system.system0.hostname)"
  json_add_string "description" "$(uci get system.system0.description)"
  json_close_object
  MSG_JSON=$(json_dump)

  curl --header "Content-Type: application/json" --request POST --data "$MSG_JSON" http://192.168.0.52:5000/api/inform
}

if [ "$#" -eq 0 ]; then
  send_heartbeat
else
  every=$1
  while true; do
    send_heartbeat
    sleep "$every"
  done
fi

#!/bin/sh
lookup_port() {
	local bridge=$1
	local portno=$(printf "0x%x" $2)
	local path

	for path in $(grep -l $portno /sys/class/net/"$bridge"/lower_*/brport/port_no); do
		basename $(readlink "${path%/brport/port_no}")
		return 0
	done

	return 1
}

parse_fdb() {
	local bridge=$1
	local callback=${2:-echo}
	local record

	IFS=$'\n'

	for record in $(
		hexdump -v -e '5/1 "%02x:" 1/1 "%02x " 1/1 "%u " 1/1 "%u " 1/4 "%u " 1/1 "%u " 3/1 "" "\n"' \
			"/sys/class/net/$bridge/brforward"
	); do
		IFS=' '
		set -- $record

		local mac=$1
		local port=$(lookup_port "$bridge" $(($5 << 16 | $2)))
		local islocal=$3
		local timer=$4
#		local ipa=$(ip neigh | grep -i -w $mac | awk '{print $1}')

		${callback:-echo} "$mac" "$port" "$islocal" "$timer" "$ipa"
	done
}

dump_entry() {
	local mac=$1
	local ifname=$2
	local islocal=$3
	local timer=$4
  local ipa=$5

	printf "MAC: %s  Ifname: %s\tLocal? %d  Timer: %d.%d\t IP4: %s\n" \
		"$mac" "$ifname" "$islocal" \
		$((timer / 100)) $((timer % 100)) "$ipa"
}
if [ "$#" -eq 0 ]; then
  for i in $(brctl show | awk 'NR>1 && NF>1 {print $1}'); do
    parse_fdb "$i" dump_entry;
  done
else
  parse_fdb "$1" dump_entry
fi

# Copyright © 2009 Adrian Perez <aperez@igalia.com>
#
# Distributed under terms of the GPLv2 license.
#
# Updated by Rami Sayar for Collectd 5.1. Added DERIVE handling.
# Updated by Grégory Starck with few enhancements.
# Updated by Paul Lockaby with only cosmetic changes.

import logging
import struct
from copy import deepcopy
from typing import Iterator

logger = logging.getLogger(__name__)

# message types
TYPE_HOST = 0x0000
TYPE_TIME = 0x0001
TYPE_PLUGIN = 0x0002
TYPE_PLUGIN_INSTANCE = 0x0003
TYPE_TYPE = 0x0004
TYPE_TYPE_INSTANCE = 0x0005
TYPE_VALUES = 0x0006
TYPE_INTERVAL = 0x0007
TYPE_TIMEHR = 0x0008
TYPE_INTERVALHR = 0x0009

# DS types
DS_TYPE_COUNTER = 0
DS_TYPE_GAUGE = 1
DS_TYPE_DERIVE = 2
DS_TYPE_ABSOLUTE = 3

DECODE_HEADER = struct.Struct("!2H")
DECODE_NUMBER = struct.Struct("!Q")
DECODE_SIGNED_NUMBER = struct.Struct("!q")  # DERIVE are signed long longs
DECODE_SHORT = struct.Struct("!H")
DECODE_DOUBLE = struct.Struct("<d")

DS_TYPE_DECODER = {
    DS_TYPE_COUNTER: DECODE_NUMBER,
    DS_TYPE_ABSOLUTE: DECODE_NUMBER,
    DS_TYPE_DERIVE: DECODE_SIGNED_NUMBER,
    DS_TYPE_GAUGE: DECODE_DOUBLE,
}

VALUES_HEADER_SIZE = DECODE_HEADER.size + DECODE_SHORT.size
SINGLE_VALUE_SIZE = 1 + 8  # 1 byte for type, 8 bytes for value


def cdtime_to_time(cdt):
    """
    :param cdt: A CollectD Time or Interval HighResolution encoded value.
    :return: A float, representing a time EPOCH value, with up to nanosec after comma.
    """
    # fairly copied from http://git.verplant.org/?p=collectd.git;a=blob;f=src/daemon/utils_time.h
    sec = cdt >> 30
    nsec = ((cdt & 0b111111111111111111111111111111) / 1.073741824) / 10**9
    return sec + nsec


def decode_network_values(_part_type, part_length, buffer):
    """Decodes a list of DS values in collectd network format"""
    values_count = DECODE_SHORT.unpack_from(buffer, DECODE_HEADER.size)[0]
    values_total_size = VALUES_HEADER_SIZE + values_count * SINGLE_VALUE_SIZE
    if values_total_size != part_length:
        raise DecoderValueError(
            "values total size != part len ({} vs {})".format(
                values_total_size, part_length
            )
        )

    results = []
    off = VALUES_HEADER_SIZE + values_count

    for ds_type in buffer[VALUES_HEADER_SIZE:off]:
        if ds_type in DS_TYPE_DECODER:
            decoder = DS_TYPE_DECODER[ds_type]
            results.append((ds_type, decoder.unpack_from(buffer, off)[0]))
        else:
            logger.warning("ds type {} not supported".format(ds_type))

        off += 8

    return results


def decode_network_number(_part_type, _part_length, buffer):
    """Decodes a number (64-bit unsigned) in collectd network format."""
    return DECODE_NUMBER.unpack_from(buffer, DECODE_HEADER.size)[0]


def decode_network_string(_part_type, part_length, buffer):
    """Decodes a string (\0 terminated) in collectd network format.
    :return: The string in utf8 format.
    """
    return buffer[DECODE_HEADER.size : part_length - 1].decode("utf-8")


DECODERS = {
    TYPE_VALUES: decode_network_values,
    TYPE_TIME: decode_network_number,
    TYPE_INTERVAL: decode_network_number,
    TYPE_HOST: decode_network_string,
    TYPE_PLUGIN: decode_network_string,
    TYPE_PLUGIN_INSTANCE: decode_network_string,
    TYPE_TYPE: decode_network_string,
    TYPE_TYPE_INSTANCE: decode_network_string,
    TYPE_TIMEHR: decode_network_number,
    TYPE_INTERVALHR: decode_network_number,
}


class DecoderException(Exception):
    pass


class DecoderValueError(DecoderException, ValueError):
    pass


class DecoderDecodeError(DecoderValueError):
    pass


class DecoderUnsupportedMessageType(DecoderValueError):
    pass


class DecoderBufferOverflow(DecoderValueError):
    pass


def decode(buffer) -> Iterator[dict]:
    offset = 0
    buffer_length = len(buffer)
    result = {
        "timestamp": None,
        "interval": None,
        "host_name": None,
        "plugin_name": None,
        "plugin_instance": None,
        "type_name": None,
        "type_instance": None,
        "value": None,
    }

    while offset < buffer_length:
        try:
            part_type, part_length = DECODE_HEADER.unpack_from(buffer, offset)
        except struct.error as err:
            raise DecoderDecodeError(err)
        if not part_length:
            raise DecoderValueError(
                "invalid part with size=0: buflen={} offset={} part_type={}".format(
                    buffer_length, offset, part_type
                )
            )

        rest = buffer_length - offset
        if part_length > rest:
            raise DecoderBufferOverflow(
                "encoded part size greater than left amount of data in buffer: buffer_length={} offset={} part_length={}".format(
                    buffer_length, offset, part_length
                )
            )

        try:
            decoder = DECODERS[part_type]
        except KeyError:
            raise DecoderUnsupportedMessageType(
                "part type {} not recognized (offset={})".format(part_type, offset)
            )

        try:
            decoded = decoder(part_type, part_length, buffer[offset:])
        except struct.error as e:
            raise DecoderDecodeError(e)

        if part_type == TYPE_TIME:
            result["timestamp"] = decoded
        elif part_type == TYPE_TIMEHR:
            result["timestamp"] = cdtime_to_time(decoded)
        elif part_type == TYPE_INTERVAL:
            result["interval"] = decoded
        elif part_type == TYPE_INTERVALHR:
            result["interval"] = cdtime_to_time(decoded)
        elif part_type == TYPE_HOST:
            result["host_name"] = decoded
        elif part_type == TYPE_PLUGIN:
            result["plugin_name"] = decoded
        elif part_type == TYPE_PLUGIN_INSTANCE:
            result["plugin_instance"] = decoded
        elif part_type == TYPE_TYPE:
            result["type_name"] = decoded
        elif part_type == TYPE_TYPE_INSTANCE:
            result["type_instance"] = decoded
        elif part_type == TYPE_VALUES:
            if len(decoded) == 1:
                result["value"] = decoded[0][1]
            else:
                result["value"] = [x[1] for x in decoded]

            # fix values
            if result["plugin_name"] is None:
                result["plugin_name"] = ""
            if result["plugin_instance"] is None:
                result["plugin_instance"] = ""
            if result["type_name"] is None:
                result["type_name"] = ""
            if result["type_instance"] is None:
                result["type_instance"] = ""

            yield deepcopy(result)

        # when we get to the "values" field then we are at the end of the
        # message. other kinds of types are ignored as permitted by the
        # collectd packet format.

        offset += part_length

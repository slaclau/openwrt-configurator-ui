import argparse
import datetime
import select
import socket
import sys
import traceback

import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base

from openwrt_configurator_ui.collectd.decoder import DecoderException, decode
from openwrt_configurator_ui.web.models import Collectd

engine = sa.create_engine(
    "sqlite:////home/slaclau/git/openwrt-configurator-ui/flask-backend/src/instance/openwrt_configurator.db",
    echo=True,
)

Base = declarative_base()

metadata = sa.MetaData()
metadata.reflect(bind=engine)

Session = sa.orm.sessionmaker(engine)
session = Session()


class Collectd(Base):
    __table__ = sa.Table("collectd", metadata)


def main(host: str, port: int) -> None:
    print("listening on {}:{}".format(host, port))
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.bind((host, port))
    s.setblocking(False)

    def do(r):
        data, addr = r.recvfrom(9000)
        print("received connection from {}".format(addr[0]))

        total = 0
        try:
            for datum in decode(data):
                datum["timestamp"] = datetime.datetime.fromtimestamp(datum["timestamp"])
                session.add(Collectd(**datum))
                total = total + 1
        except DecoderException as e:
            print("could not process data from {}: {}".format(addr[0], e))
        session.commit()
        print(f"Commited {total} metrics to db")

    while True:
        try:
            ready = select.select([s], [], [], 1)[0]
            for r in ready:
                do(r)
        except Exception as e:
            traceback.print_exc()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="listener")
    parser.add_argument("--ip", default="0.0.0.0", help="IP address to listen on")
    parser.add_argument(
        "--port", default=5001, type=int, help="port number to listen on"
    )
    args = parser.parse_args()

    main(args.ip, args.port)
    sys.exit(0)

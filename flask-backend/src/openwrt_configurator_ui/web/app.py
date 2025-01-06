from flask import Flask
from flask_socketio import SocketIO

from openwrt_configurator_ui.web.db import db
import openwrt_configurator_ui.web.models

app = Flask(__name__)
socketio = SocketIO(
    app,
    # logger=True,
    cors_allowed_origins=[
        "http://localhost:5173",
        "ws://localhost:5000",
        "http://192.168.0.52:5173",
    ],
)
db_name = "openwrt_configurator.db"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + db_name
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True
db.init_app(app)

with app.app_context():
    print("Create all")
    db.create_all()

# collectd_thread = Thread(target=listener.main, args=["0.0.0.0", 5001, db, app])
# collectd_thread.start()

from openwrt_configurator_ui.web.db import db
from openwrt_configurator_ui.web.main import app, socketio


def run(debug=False, use_reloader=False):
    socketio.run(
        app,
        host="0.0.0.0",
        debug=debug,
        use_reloader=use_reloader,
        allow_unsafe_werkzeug=True,
    )


if __name__ == "__main__":
    try:
        run(debug=True, use_reloader=True)
    except KeyboardInterrupt:
        pass

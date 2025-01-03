from openwrt_configurator_ui.web.app import app, db, socketio
from openwrt_configurator_ui.web.routes.config import config
from openwrt_configurator_ui.web.routes.manage import manage
from openwrt_configurator_ui.web.routes.status import status
from openwrt_configurator_ui.web.routes.ubus import ubus

app.register_blueprint(status, url_prefix="/api")
app.register_blueprint(ubus, url_prefix="/api")
app.register_blueprint(config, url_prefix="/api/configuration")
app.register_blueprint(manage, url_prefix="/api/manage")

app.run()

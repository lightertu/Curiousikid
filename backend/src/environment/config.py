import os
from pathlib import Path

from dynaconf import Dynaconf

# Go up three levels from the current file's directory (environment -> control_server -> src -> control-server)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MEMORY_ROOT = f"{PROJECT_ROOT}/src/memory"

__ROOT_PATH = os.path.dirname(os.path.realpath(__file__))
__DYNACONF_ENV_KEY__ = "DYNACONF_ENV"
__DYNACONF_ENV_VALUE__ = "dev"

__CURRENT_DIR__ = "src/holdon/environment"

if os.environ.get(__DYNACONF_ENV_KEY__) == "prod":
    __SETTING_FILES = ["prod.yml", "secrets.yml"]
else:
    __SETTING_FILES = ["local.yml", "secrets.yml"]

ENV = Dynaconf(
    envvar_prefix="DYNACONF",
    settings_files=__SETTING_FILES,
    root_path=__ROOT_PATH,
)

os.environ["LIVEKIT_URL"] = ENV.LIVEKIT_URL
os.environ["LIVEKIT_API_KEY"] = ENV.LIVEKIT_API_KEY
os.environ["LIVEKIT_API_SECRET"] = ENV.LIVEKIT_API_SECRET
os.environ["OPENAI_API_KEY"] = ENV.OPENAI_API_KEY
os.environ["DEEPGRAM_API_KEY"] = ENV.DEEPGRAM_API_KEY
os.environ["ELEVENLABS_API_KEY"] = ENV.ELEVENLABS_API_KEY
os.environ["ANTHROPIC_API_KEY"] = ENV.ANTHROPIC_API_KEY
os.environ["MEM0_API_KEY"] = ENV.MEM0_API_KEY
os.environ["PIXEL_LAB_API_KEY"] = ENV.PIXEL_LAB_API_KEY

# `envvar_prefix` = export envvars with `export DYNACONF_FOO=bar`.
# `settings_files` = Load these files in the order.

# You can add other configuration variables here if needed
# For example:
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./default.db")
# LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

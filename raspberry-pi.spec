# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for ManyPaintings Raspberry Pi executable
Optimized for ARM architecture and Linux environment
"""

import os
from pathlib import Path

# Get the application directory
app_dir = Path(os.getcwd())

# Collect all static files
def collect_static_files():
    """Collect all static files for bundling"""
    static_files = []
    
    # Images
    images_dir = app_dir / 'static' / 'images'
    if images_dir.exists():
        for img_file in images_dir.glob('*'):
            if img_file.is_file():
                static_files.append((str(img_file), 'static/images'))
    
    # Audio files
    audio_dir = app_dir / 'static' / 'audio'
    if audio_dir.exists():
        for audio_file in audio_dir.glob('*'):
            if audio_file.is_file():
                static_files.append((str(audio_file), 'static/audio'))
    
    # CSS and JS
    css_dir = app_dir / 'static' / 'css'
    if css_dir.exists():
        for css_file in css_dir.glob('*'):
            if css_file.is_file():
                static_files.append((str(css_file), 'static/css'))
    
    js_dir = app_dir / 'static' / 'js'
    if js_dir.exists():
        for js_file in js_dir.glob('*'):
            if js_file.is_file():
                static_files.append((str(js_file), 'static/js'))
    
    return static_files

def collect_templates():
    """Collect all template files"""
    template_files = []
    templates_dir = app_dir / 'templates'
    if templates_dir.exists():
        for template_file in templates_dir.glob('*'):
            if template_file.is_file():
                template_files.append((str(template_file), 'templates'))
    return template_files

def collect_config_files():
    """Collect configuration files"""
    config_files = []
    
    # Main config files
    for config_file in ['config.json', 'config.example.json']:
        config_path = app_dir / config_file
        if config_path.exists():
            config_files.append((str(config_path), '.'))
    
    # Config module
    config_dir = app_dir / 'config'
    if config_dir.exists():
        for py_file in config_dir.glob('*.py'):
            config_files.append((str(py_file), 'config'))
    
    return config_files

# Collect all data files
datas = []
datas.extend(collect_static_files())
datas.extend(collect_templates())
datas.extend(collect_config_files())

# Add utils module files
utils_dir = app_dir / 'utils'
if utils_dir.exists():
    for py_file in utils_dir.glob('*.py'):
        datas.append((str(py_file), 'utils'))

a = Analysis(
    ['launcher.py'],
    pathex=[str(app_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'app',
        'config',
        'utils.image_manager',
        'flask',
        'werkzeug',
        'jinja2',
        'PIL',
        'PIL.Image',
        'PIL.ImageOps',
        'requests',
        'threading',
        'json',
        'hashlib',
        'pathlib',
        'datetime',
        'os',
        'sys',
        'platform',
        'subprocess',
        'webbrowser',
        'time'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'jupyter',
        'IPython',
        'notebook',
        'win32api',
        'win32gui',
        'win32con',
        'winsound'
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ManyPaintings-RaspberryPi',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # UPX often causes issues on ARM
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
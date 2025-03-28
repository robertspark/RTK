#!/bin/bash

echo "Updating and upgrading system..."

# Update and upgrade system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y && apt autoremove -y

# List of programs to install
PROGRAMS=(
  "git"        # Version control system
  "curl"       # Command-line URL tool
  "nodejs"     # JavaScript runtime
  "npm"        # Node.js package manager
  "python3-dev" # Python3 dev package
  "python3-serial" # Python3 serial library
  "python3-smbus" # Python3 smbus package for i2c
  "i2c-tools" # i2c tools package
  "rpi-connect" # rasperry pi connect (anywhere) lite
  "ufw" # uncomplicated fire wall (use with ntrip)
  "build-essential"
)

# Install programs with error handling
echo "Installing programs..."
for PROGRAM in "${PROGRAMS[@]}"; do
  if dpkg -l | grep -q "^ii  $PROGRAM "; then
    echo "[SKIP] $PROGRAM is already installed."
  else
    # Check if the package exists in the repository before installing
    if apt-cache show "$PROGRAM" &>/dev/null; then
      echo "Installing $PROGRAM..."
      if sudo apt install -y "$PROGRAM"; then
        echo "[SUCCESS] Installed $PROGRAM."
      else
        echo "[ERROR] Failed to install $PROGRAM." >&2
      fi
    else
      echo "[ERROR] Package '$PROGRAM' not found in the APT repository. Skipping..." >&2
    fi
  fi
done

echo "Installation complete!"

echo "Checking if Node.js is installed..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "Cloning RTK repository..."
if [ -d "/home/pi/RTK" ]; then
    echo "Repository already exists. Pulling latest changes..."
    cd /home/rob/RTK && git pull
else
    git clone https://github.com/robertspark/RTK.git /home/pi/RTK
    cd /home/rob/RTK
fi

echo "Installing Node.js dependencies..."
npm install express socket.io serialport @serialport/parser-readline i2c-bus

echo "Creating systemd service..."
SERVICE_PATH="/etc/systemd/system/gnss-server.service"
if [ ! -f "$SERVICE_PATH" ]; then
    sudo bash -c 'cat > /etc/systemd/system/gnss-server.service' <<EOF
[Unit]
Description=GNSS Node.js Server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/rob/RTK/server.js
WorkingDirectory=/home/rob/RTK
Restart=always
User=rob
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gnss-server

[Install]
WantedBy=multi-user.target
EOF
    echo "Enabling and starting the GNSS server..."
    sudo systemctl daemon-reload
    sudo systemctl enable gnss-server
    sudo systemctl start gnss-server
else
    echo "GNSS server service already exists."
fi

echo "Cleaning up unnecessary packages..."
sudo apt autoremove -y

echo "Setup complete. Server is running at boot!"

#!/bin/bash

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
  "rpi-connect-lite" # rasperry pi connect (anywhere) lite
  "ufw" # uncomplicated fire wall (use with ntrip)
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

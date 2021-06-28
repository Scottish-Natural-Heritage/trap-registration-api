#!/bin/sh

# --batch to prevent interactive command
# --yes to assume "yes" for questions

gpg \
  --quiet \
  --batch \
  --yes \
  --decrypt \
  --passphrase="$JWT_KEY_GPG_PASSPHRASE" \
  --output ./.secrets/jwt-key \
  ./.secrets/jwt-key.gpg

#!/usr/bin/env bash

echo "first update .bash_profile per brew directions. Sample is provided in yahoo guerilla branch"
while true; do
    read -p "Do you wish to continue program?" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done
source ~/.bash_profile
xcode-select --install
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew update
brew doctor
brew install git
brew install python
pip install plumbum
pip install sh
brew upgrade
brew cleanup
exit 0


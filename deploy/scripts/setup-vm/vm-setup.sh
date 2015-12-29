#!/usr/bin/env bash
# for pm2 to work the git ssh key must have no passphrase

echo "first update .bash_profile and .bashrc using supplied sample files is this directory."
while true; do
    read -p "Do you wish to continue program?" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done
xcode-select --install
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew update
brew doctor
#upgrade everything.
brew upgrade
brew install android-sdk
source ~/.bash_profile
expect -c '
set timeout -1;
spawn android - update sdk --no-ui;
expect {
    "Do you accept the license" { exp_send "y\r" ; exp_continue }
    eof
}
'
sudo gem install xcpretty
brew install git
brew install python
brew install node
npm install pm2 -g
brew cleanup
exit 0
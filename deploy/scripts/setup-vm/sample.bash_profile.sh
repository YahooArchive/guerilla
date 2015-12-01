
if [ -z "ANDROID_HOME"]; then export ANDROID_HOME=$HOME/Library/Android/sdk; fi

if [ -d "$ANDROID_HOME" ]; then
  export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
fi

export PATH=~/bin:/usr/local/bin:usr/bin:"/Applications/VMware Fusion.app/Contents/Library":$PATH

export DEVELOPER_DIR=`xcode-select --print-path`

#export EDITOR='subl -w'
export EDITOR='$HOME/bin/mate -w'

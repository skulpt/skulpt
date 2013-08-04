if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
  echo -e "Starting to update v8\n"
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  #using token clone gh-pages branch
  cd $HOME
  git clone --quiet https://${GH_TOKEN}@github.com/albertjan/skulpt.git v8 > /dev/null
  #go into diractory and copy data we're interested in to that directory
  cd v8/support/d8
  cp $HOME/build/albertjan/d8 ./d8x64
  #add, commit and push files
  git add d8x64
  git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed [ci skip]"
  git push -fq origin master > /dev/null
  echo -e "Done magic with coverage\n"
fi

if [[ "$TRAVIS_PULL_REQUEST" == "false"] && ["$TRAVIS_TEST_RESULT" == 0 ]]; then
  echo -e "Starting to update of dist folder\n"
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  #using token clone gh-pages branch
  cd $HOME
  git clone --quiet https://${GH_TOKEN}@github.com/bnmnetp/skulpt.git dist > /dev/null
  cd dist
  ./m dist
  cd dist
  #add, commit and push files
  git add -u
  git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed [ci skip]"
  git push -fq origin master > /dev/null
  echo -e "Done magic with coverage\n"
else
  echo -e "Not updating dist folder because TRAVIS_PULL_REQUEST = $TRAVIS_PULL_REQUEST and TRAVIS_TEST_RESULT = $TRAVIS_TEST_RESULT"
fi

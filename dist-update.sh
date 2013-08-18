if [[ "$TRAVIS_PULL_REQUEST" == "false"] && ["$TRAVIS_TEST_RESULT" == 0 ]]; then
  echo -e "Starting to update of dist folder\n"
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  cd $HOME
  #clone skulpt
  git clone --quiet https://${GH_TOKEN}@github.com/skulpt/skulpt.git skulpt > /dev/null
  #clone dist
  git clone --quiet https://${GH_TOKEN}@github.com/skulpt/skulpt-dist.git dist > /dev/null
  #build skulpt
  cd skulpt
  ./skulpt.py dist
  cd dist
  #add, commit and push files to the dist repository
  cp *.js ../../dist/
  cd ../../dist
  git add -u
  git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed"
  git push -fq origin master > /dev/null
  echo -e "Done magic with coverage\n"
else
  echo -e "Not updating dist folder because TRAVIS_PULL_REQUEST = $TRAVIS_PULL_REQUEST and TRAVIS_TEST_RESULT = $TRAVIS_TEST_RESULT"
fi

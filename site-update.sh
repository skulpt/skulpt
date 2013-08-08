if [ "$TRAVIS_BRANCH" == "skulpt-org" ]; then
  echo "Updating site"
  cd $HOME
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  git clone --quiet https://${GH_TOKEN}@github.com/bnmnetp/skulpt.git site > /dev/null
  cd site
  ./m upload ${GAE_PASS} > /dev/null
  echo "Successfully updated skulpt.org
fi
if [[ "$TRAVIS_BRANCH" == "skulpt-org" ] && [ "$TRAVIS_PULL_REQUEST" == "false"] && ["$TRAVIS_TEST_RESULT" == 0 ]]; then
  echo "Updating site"
  cd $HOME
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  git clone --quiet https://${GH_TOKEN}@github.com/bnmnetp/skulpt.git site > /dev/null
  cd site/doc
  $HOME/google-appengine/appcfg.py --oauth2_refresh_token=${GAE_TOKEN} update /
  echo "Successfully updated skulpt.org
fi
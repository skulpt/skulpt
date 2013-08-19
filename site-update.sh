if [[ "$TRAVIS_PULL_REQUEST" == "false" && "$TRAVIS_TEST_RESULT" == "0" && "$NEWTAG" == "true" ]]; then
  echo "Updating site"
  cd $HOME/skulpt/doc
  $HOME/google-appengine/appcfg.py --oauth2_refresh_token=${GAE_REFRESH_TEST} update ./
  echo "Successfully updated skulpt.org"
fi
if [[ "$TRAVIS_PULL_REQUEST" == "false" && "$TRAVIS_TEST_RESULT" == "0" && "$TRAVIS_BRANCH" == "master" ]]; then
  echo -e "Starting to update of dist folder\n"
  #configure git to commit as Travis
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"

  cd $HOME

  #clone skulpt
  git clone --quiet https://${GH_TOKEN}@github.com/skulpt/skulpt.git skulpt # > /dev/null
  #clone dist
  git clone --quiet https://${GH_TOKEN}@github.com/skulpt/skulpt-dist.git dist # > /dev/null

  #compare tags
  cd $HOME
  cd skulpt
  git tag > ../tags-skulpt
  cd ../dist
  git tag > ../tags-dist
  cd ..

  #compare two files per line.
  #-F, --fixed-strings
  #              Interpret PATTERN as a list of fixed strings, separated by newlines, any of which is to be matched.
  #-x, --line-regexp
  #              Select only those matches that exactly match the whole line.
  #-v, --invert-match
  #              Invert the sense of matching, to select non-matching lines.
  #-f FILE, --file=FILE
  #            Obtain patterns from FILE, one per line. The empty file contains zero patterns, and therefore matches nothing.
  grep -Fxvf tags-dist tags-skulpt > new-tags

  for TAG in $(cut -d, -f2 < new-tags)
  do
    echo "Found new tag: $TAG"
    #we have a new tag
    export NEWTAG=true
    #build skulpt at this tag
    cd $HOME/skulpt
    git checkout tags/$TAG
    echo -n "running npm install"
    npm install
    npm run build
    #create zip and tarbals
    cd dist
    tar -czf skulpt-latest.tar.gz *.js
    zip skulpt-latest.zip *.js
    mkdir -p ../doc/static/dist
    mv *.zip ../doc/static/dist/
    mv *.tar.gz ../doc/static/dist/
    #update skulpt for the site.
    cp skulpt.min.js ../doc/static/
    cp skulpt-stdlib.js ../doc/static/
    cp *.js ../../dist/
    cd ..
    cp bower.json ../dist
    cp .bowerrc ../dist
    npm run devbuild
    cp dist/skulpt.js ../dist/skulpt.js
    npm run build-es5
    cp dist/skulpt.min.js ../dist/skulpt.es5.min.js
    #put the new version in the dist repository
    cd ../dist
    git add .
    git commit -m "Skulpt version: $TAG"
    git tag $TAG
    git push -fq --tags origin master > /dev/null
  done

  #reset dist repository to HEAD just to be sure
  cd $HOME
  cd dist
  git reset HEAD --hard
  cd $HOME

  #build skulpt
  cd skulpt
  git reset HEAD --hard
  npm install
  npm run build
  cd dist
  cp *.js ../../dist/

  cd ..
  cp bower.json ../dist
  cp .bowerrc ../dist
  npm run devbuild
  cp dist/skulpt.js ../dist/skulpt.js
  npm run build-es5
  cp dist/skulpt.min.js ../dist/skulpt.es5.min.js

  #add, commit and push files to the dist repository
  cd ../dist
  git add .
  git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed"
  git push -fq origin master > /dev/null

else
  echo -e "Not updating dist folder because TRAVIS_PULL_REQUEST = $TRAVIS_PULL_REQUEST and TRAVIS_TEST_RESULT = $TRAVIS_TEST_RESULT and TRAVIS_BRANCH $TRAVIS_BRANCH"
fi

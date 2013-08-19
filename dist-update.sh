if [[ "$TRAVIS_PULL_REQUEST" == "false" && "$TRAVIS_TEST_RESULT" == "0" ]]; then
  echo -e "Starting to update of dist folder\n"
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
  cd $HOME
  
  #clone skulpt
  git clone --quiet https://${GH_TOKEN_TEST}@github.com/skulpt/skulpt.git skulpt # > /dev/null
  #clone dist
  git clone --quiet https://${GH_TOKEN_TEST}@github.com/skulpt/skulpt-dist.git dist # > /dev/null
  
  #compare tags
  cd $HOME  
  cd skulpt  
  git tag > ../tags-skulpt  
  cd ../dist  
  git tag > ../tags-dist  
  cd ..  
  grep -Fxvf tags-dist tags-skulpt > new-tags
  
  for TAG in $(cut -d, -f2 < new-tags)
  do
    echo "Found new tag: $TAG"
    #we have a new tag
    export NEWTAG=true
    #build skulpt at this tag
    cd $HOME/skulpt
    git checkout tags/$TAG
    ./skulpt.py dist
    #create zip and tarbals
    cd dist
    tar -czf skulpt-latest.tar.gz *.js 
    zip skulpt-latest.zip *.js
    mkdir -p ../doc/static/dist
    mv *.zip ../doc/static/dist/
    mv *.tar.gz ../doc/static/dist/
    cp *.js ../../dist/
    #put the new version in the dist repository
    cd ../../dist
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

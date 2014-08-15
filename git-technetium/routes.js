module.exports = function(router, request, async) {
    // Router will handle any requests with this endpoint depending on where router is "use()'d.
    router.get('/helloworld', function(req, res) {
        // Returns a JSON response when user visits this endpoint
        var url = 'http://nhlwc.cdnak.neulion.com/fs1/nhl/league/teamroster/PIT/iphone/clubroster.json';
        request(url, function(error, response, body){
            if(!error && response.statusCode === 200){
                res.send(body);
            }
        });
    });

    /**
     *  Precondition:
     *      ownerName (string): The owner username of the target repository
     *      repoName  (string): The target repository name
     *  Postcondition:
     *      An array, where each element contains the title of an issue in the repository
    **/
    router.get('/issues', function(req, res) {
        request({
            url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/issues?state=all',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body) {
            if(!error && response.statusCode === 200) {
                var issueTitles = [];
                for(var issueIndex = 0; issueIndex < body.length; issueIndex++) {
                    if(!body[issueIndex].pull_request) {
                        issueTitles.push(body[issueIndex].title);
                    }
                }
                res.send(issueTitles);
            }
        });
    });

    /**
     *  Precondition:
     *      ownerName (string): The owner username of the target repository
     *      repoName  (string): The target repository name
     *  Postcondition:
     *      An array of objects, where each object contains the following properties:
     *          name (string): The contributor username
     *          issues_opened (string): The number of issues opened by the respective contributor
    **/
    router.get('/issues_opened', function(req, res) {
        request({
            url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body) {
            if(!error && response.statusCode === 200) {
                var contributors = [];
                for(var contributorIndex = 0; contributorIndex < body.length; contributorIndex++){
                    contributors.push(body[contributorIndex].login);
                }

                var contributorIssuesOpened = [];
                for(var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++) {
                    contributorIssuesOpened.push({
                        'name': contributors[contributorIndex],
                        'issues_opened': 0
                    });
                }

                
                var json = [];
                var pageCounter = 1;

                var getData = function(pageCounter){
                    request({
                        url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/issues?state=all&page=' + pageCounter,
                        headers: { 'user-agent': 'git-technetium' },
                        json: true
                    }, function(error, response, body) {
                        if(!error && response.statusCode === 200) {
                            for(var issueIndex = 0; issueIndex < body.length; issueIndex++) {
                                if(!body[issueIndex].pull_request) {
                                    json.push(body[issueIndex]);
                                }
                            }
                            if(body.length <30){
                                for(var issueIndex = 0; issueIndex < json.length; issueIndex++){
                                    for(var contributor_index = 0; contributor_index < contributorIssuesOpened.length; contributor_index++){
                                        if(json[issueIndex].user.login === contributorIssuesOpened[contributor_index].name){
                                            contributorIssuesOpened[contributor_index].issues_opened++;
                                        }
                                    }
                                }
                                res.send(contributorIssuesOpened);
                            } else{
                                getData(pageCounter + 1);
                            }
                            //res.send(urls);
                        }
                    }); // end request
                } // end getData function call
                getData(1);


            }
        });
    });

    /**
     *  Precondition:
     *      ownerName (string): The owner username of the target repository
     *      repoName  (string): The target repository name
     *  Postcondition:
     *      An array of objects, where each object contains the following properties:
     *          name (string): The contributor username
     *          issues_opened (string): The number of issues assigned to the respective contributor
    **/
    router.get('/issues_assigned', function(req, res) {
        request({
            url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body) {
            if(!error && response.statusCode === 200) {
                var contributors = [];
                for(var contributorIndex = 0; contributorIndex < body.length; contributorIndex++){
                    contributors.push(body[contributorIndex].login);
                }

                var contributorIssuesAssigned = [];
                for(var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++) {
                    contributorIssuesAssigned.push({
                        'name': contributors[contributorIndex],
                        'issues_assigned': 0
                    });
                }

                var json = [];
                var pageCounter = 1; 

                var getData = function(pageCounter){
                    request({
                        url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/issues?state=all&page=' + pageCounter,
                        headers: { 'user-agent': 'git-technetium' },
                        json: true
                    }, function(error, response, body) {
                        if(!error && response.statusCode === 200) {
                            for(var issueIndex = 0; issueIndex < body.length; issueIndex++) {
                                if(!body[issueIndex].pull_request) {
                                    json.push(body[issueIndex]);
                                }
                            }
                            if(body.length < 30){
                                for(var issueIndex = 0; issueIndex < json.length; issueIndex++){
                                    for(var contributorIndex = 0; contributorIndex < contributorIssuesAssigned.length; contributorIndex++){
                                        if(json[issueIndex].assignee && json[issueIndex].assignee.login === contributorIssuesAssigned[contributorIndex].name){
                                            contributorIssuesAssigned[contributorIndex].issues_assigned++;
                                        }
                                    }
                                }
                                res.send(contributorIssuesAssigned);
                            } else{
                                getData(pageCounter + 1);
                            }
                        }
                    }); // end request
                }
                getData(1);
            }
        });
    });

    /**
     *  Precondition:
     *      ownerName (string): The owner username of the target repository
     *      repoName (string): The target repository name
     *  Postcondition:
     *      An array of objects, where each object contains the following properties:
     *          name (string): The contributor username
     *          issues_opened (string): The number of issues closed by the respective contributor
    **/
    router.get('/issues_closed', function(req, res) {
        request({
            url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body) {
            if(!error && response.statusCode === 200) {
                var contributors = [];
                for(var contributorIndex = 0; contributorIndex < body.length; contributorIndex++){
                    contributors.push(body[contributorIndex].login);
                }
 
                var contributorIssuesClosed = [];
                for(var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++) {
                    contributorIssuesClosed.push({
                        'name': contributors[contributorIndex],
                        'issues_closed': 0
                    });
                }
 
                // An array containing all issue numbers that we want to get events for.
                // These issue numbers are only issues not generated by pull requests. 
                var issueNumbers = [ ];

                /*
                    Algorithm: getData is a function of pageCounter, which denotes the current url being processed.
                               It will loop through batches of 30 datasets, and if the issue was not generated by
                               a pull request, we store it inside of `issueNumbers` to be processed by async.each.
                               If the length of the body is === 30, there could be more data, so we call the getData
                               function repeatedly until body is < 30 (meaning we have no more URLs to process).
                               Lastly, the issueNumbers array is processed by async.each, which handles getting the
                               event data from each issue. 
    
                */
                var getData = function(pageCounter) {
                    request({
                        url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/issues?state=closed&page=' + pageCounter,
                        headers: { 'user-agent': 'git-technetium' },
                        json: true
                    }, function(error, response, body){
                        if(!error && response.statusCode === 200){
                            // build array of issue numbers to get events for
                            for(var issueIndex = 0; issueIndex < body.length; issueIndex++){
                                // if the issue was not generated by a pull request, save this issue number for future processing
                                if(!body[issueIndex].pull_request){
                                    issueNumbers.push(body[issueIndex].number);
                                }
                            }
                            // If the length of the body is < 30, we know we are processing the last page of data.
                            // We pass the data to async.each for further processing and to send the client the data. 
                            if(body.length < 30) {
                                // For each Issue Number inside of the issueNumbers array, we want to send a request to get that issue's events.
                                // async.each will apply the request function for each item inside the issueNumbers array.
                                async.each(issueNumbers, function(number, callback) {
                                      request({
                                        url: 'https://api.github.com/repos/' + req.query.ownerName + '/' + req.query.repoName + '/issues/' + number + '/events',
                                        headers: { 'user-agent' : 'git-technetium' },
                                        json: true
                                      }, function(error, response, body){
                                           if(!error && response.statusCode === 200){
                                                for(var eventData = 0; eventData < body.length; eventData++){
                                                    if(body[eventData].event === 'closed'){
                                                        for(contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++){
                                                            if(body[eventData].actor.login === contributorIssuesClosed[contributorIndex].name){
                                                                contributorIssuesClosed[contributorIndex].issues_closed++;
                                                            }
                                                        }// end inner for loop
         
                                                    } // end if
                                                } // end outer for loop
                                           } // end if

                                            // If we have processed all the requests, we send a callback with the data attached.  
                                            // According to the documentation, if you send callback() with anything inside,
                                            // it gets reported as an error. Conveniently, we can use this to our advantage.
                                            // When all requests are done, send the data through a callback to access it at 
                                            // the end, and send it up to the server. 
                                             if(issueNumbers.indexOf(number) === issueNumbers.length - 1){
                                                callback({data: contributorIssuesClosed});
                                            }
         
                                        }) // end request
                                    }, function(err){
                                    // We can access the data processed by async.each through the error callback. 
                                    if( err ) {
                                      res.send(err.data);
                                    } else {
                                      console.log("Done");
         
                                    }
                                });   
                            } else {
                                // We are not done yet, there might be more data to grab. Call the function again with the next page.
                                getData(pageCounter + 1);
                            }
                        }
                    }); // end second request
                }
                // Call function to get all data. 
                getData(1);
            } // end first request if statement
        }); // end first request 
    }); // end router.get

    /**
      * Route to query total commits per contributor within a given repository.
      * params: owner, repo
      * github api endpoint: https://api.github.com/repos/:owner/:repo/stats/contributors
    **/
    router.get('/commits', function(req, res){
        request({
            url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/stats/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                var contributors = [];
                for(var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    contributors.push("Author: " + body[contributor_index].author.login + " , " + "Commits: " + body[contributor_index].total);
                }
                res.send(contributors);

            }
        });
    });

    /**
      * Route to query lines of code added/deleted per contributor within a given repository.
      * params: owner, repo
      * github api endpoint: https://api.github.com/repos/:owner/:repo/stats/contributors
    **/
    router.get('/loc', function(req, res){
        request({
            url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/stats/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                var loc_added = 0;
                var loc_deleted = 0;
                var contributors = [];
                for(var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    for(var week_index = 0; week_index < body[contributor_index].weeks.length; week_index++){
                        loc_added += body[contributor_index].weeks[week_index].a;
                        loc_deleted += body[contributor_index].weeks[week_index].d;
                    }
                    contributors.push("Author: " + body[contributor_index].author.login + " , " + "Added: " + loc_added + " , " + "Deleted: " + loc_deleted);
                }
                res.send(contributors);

            }
        });
    }); // End router.get

     /**
      * Route to query total commit comments per contributor within a given repository.
      * params: owner, repo
      * github api endpoint: https://api.github.com/repos/:owner/:repo/comments
    **/
    router.get('/commitComments', function(req, res){
        // First request builds a list of all contributors for a given repository.
        request({
            url: 'https://api.github.com/repos/DrkSephy/git-technetium/contributors',
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                var contributors =[];

                for(var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    contributors.push(body[contributor_index].login);
                }

                var contributor_comments = [];
                for(var contributor_index = 0; contributor_index < contributors.length; contributor_index++){
                    contributor_comments[contributor_index] = {
                        'name': contributors[contributor_index],
                        'commit_comments': 0
                    };
                }

                var json = [];
                var pageCounter = 1;

                var getData = function(pageCounter){
                    request({
                        url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/comments?page=' + pageCounter,
                        headers: { 'user-agent' : 'git-technetium' },
                        json: true
                    }, function(error, response, body){
                        if(!error && response.statusCode === 200){
                            for(var comment_index = 0; comment_index < body.length; comment_index++){
                                json.push(body[comment_index]);
                            }
                            if(body.length < 30){
                                for(var commentIndex = 0; commentIndex < json.length; commentIndex++){
                                    for(var contributorIndex = 0; contributorIndex < contributor_comments.length; contributorIndex++){
                                        if(json[commentIndex].user.login === contributor_comments[contributorIndex].name){
                                            contributor_comments[contributorIndex].commit_comments++;
                                        }
                                    }
                                }
                                res.send(contributor_comments);
                            } else {
                                getData(pageCounter + 1);
                            }
                        }
                    }); // End second request function
                }
                getData(1);

            }
        }); // End first request function
    });

    /**
     **Route to query the total pull requests per contributor within a given repository
     **params: ownerName, repoName
    **/
    router.get('/pulls', function(req, res){
        request({
            url: 'https://api.github.com/repos/'+req.query.owner + '/' + req.query.repo + '/contributors',
            headers: {'user-agent' : 'git-technetium'},
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                var contributors =[];
                var contributor_tally =[];

                //Obtaining list of contributors
                for (var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    contributors.push(body[contributor_index].login);
                }

                //Initializing the contributors list to 0
                for (var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    contributor_tally.push({
                        'name' : contributors[contributor_index],
                        'total': 0
                    });
                }

                request({
                    url: 'https://api.github.com/repos/'+req.query.owner + '/' + req.query.repo + '/pulls?state=closed',
                    headers: {'user-agent' : 'git-technetium'},
                    json: true
                }, function(error, response, body){
                    if(!error && response.statusCode === 200){
                        for (var pullsIndex = 0; pullsIndex < body.length; pullsIndex++){
                            for(var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++){
                                if(body[pullsIndex].user.login === contributor_tally[contributorIndex].name){
                                    contributor_tally[contributorIndex].total++;
                                }
                            }
                        }
                    }
                    res.send(contributor_tally);
                    //end of second if
                });
                //End of second request
            }
            //end of IF
        });
        //End of first request
    });

    /**
     **Route to query the total issues comments  per contributor within a given repository
     **params: ownerName, repoName
    **/
    router.get('/issuesComments', function(req, res){
        request({
            url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/contributors',
            headers: {'user-agent' : 'git-technetium'},
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                var contributors = [];
                //Obtaining list of contributors
                for (var contributorIndex = 0; contributorIndex < body.length; contributorIndex++){
                    contributors.push(body[contributorIndex].login);
                }

                var contributor_tally =[];
                //Initializing the contributors list to 0
                for (var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++){
                     contributor_tally.push({
                        'name': contributors[contributorIndex],
                        'comments': 0
                    });
                }

                var json = [];
                var pageCounter = 1;

                var getData = function(pageCounter){
                    request({
                        url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/issues/comments?page=' + pageCounter,
                        headers: {'user-agent' : 'git-technetium'},
                        json: true                    
                    }, function(error, response, body){
                        if(!error && response.statusCode === 200){
                            var re = '/pull';
                            for (var issuesIndex = 0; issuesIndex < body.length; issuesIndex++){
                                if(!body[issuesIndex].html_url.match(re)){
                                    json.push(body[issuesIndex]);
                                }
                            }   
                            if(body.length < 30){
                                for(var issuesIndex = 0; issuesIndex < json.length; issuesIndex++){
                                    for(var contributorIndex = 0; contributorIndex < contributor_tally.length; contributorIndex++){
                                        if(json[issuesIndex].user.login === contributor_tally[contributorIndex].name){
                                            contributor_tally[contributorIndex].comments++;
                                            console.log(contributor_tally);
                                        }
                                    }
                                }
                                res.send(contributor_tally);
                            } else {
                                getData(pageCounter + 1);
                            }                     
                        }
                    }); //End of second request   
                }
                getData(1);
            }
        });
        //End of first request
    });

    /**
     **Route to query the pull request comments  per contributor within a given repository
     **params: ownerName, repoName
    **/
    router.get('/pullRequestComments', function(req, res){
        request({
            url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/contributors',
            headers: {'user-agent' : 'git-technetium'},
            json: true
        }, function(error, response, body){
            if(!error && response.statusCode === 200){
                
                var contributors = [];
                //Obtaining list of contributors
                for (var contributor_index = 0; contributor_index < body.length; contributor_index++){
                    contributors.push(body[contributor_index].login);
                }

                var contributor_tally =[];
                //Initializing the contributors list to 0
                for (var contributor_index = 0; contributor_index < contributors.length; contributor_index++){
                     contributor_tally.push({
                        'name': contributors[contributor_index],
                        'comments': 0
                    });
                }

                var json = [];
                var pageCounter = 1;

                var getData = function(pageCounter){
                    request({
                        url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/issues/comments?state=closed&page=' + pageCounter,
                        headers: {'user-agent' : 'git-technetium'},
                        json: true
                    },function(error, response, body){
                        if(!error && response.statusCode === 200){
                            var re = '/pull';
                            for (var requestIndex = 0; requestIndex < body.length; requestIndex++){
                                if(body[requestIndex].html_url.match(re)){
                                    json.push(body[requestIndex]);
                                }
                            }
                            if(body.length < 30){
                                for(var requestIndex = 0; requestIndex < json.length; requestIndex++){
                                    for(var contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++){
                                        if(json[requestIndex].user.login === contributor_tally[contributorIndex].name){
                                            contributor_tally[contributorIndex].comments++;
                                        }
                                    }
                                }
                                res.send(contributor_tally);
                            } else {
                                getData(pageCounter + 1);
                            }
                        }

                    }); //End of second request
                }
                getData(1);

            } //contributors
        }); //End of first request
    });

}


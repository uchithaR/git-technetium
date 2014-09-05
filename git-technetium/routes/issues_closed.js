module.exports = function(router, request, async, config) {
    /**
     *  Precondition:
     *      ownerName (string): The owner username of the target repository
     *      repoName (string): The target repository name
     *  Postcondition:
     *      An array of objects, where each object contains the following properties:
     *          name (string): The contributor username
     *          issues_opened (string): The number of issues closed by the respective contributor
     */
    router.get('/issues_closed', function(req, res) {
        request({
            url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/contributors' + '?' + 'client_id=' + config.CLIENT_ID + '&' + 'client_secret=' + config.CLIENT_SECRET,
            headers: { 'user-agent': 'git-technetium' },
            json: true
        }, function(error, response, body) {
            if(!error && response.statusCode === 200) {
                var contributors = [];
                for(var contributorIndex = 0; contributorIndex < body.length; contributorIndex++) {
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
                var issueNumbers = [];

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
                        url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/issues?state=closed&page=' + pageCounter + '&' + 'client_id=' + config.CLIENT_ID + '&' + 'client_secret=' + config.CLIENT_SECRET,
                        headers: { 'user-agent': 'git-technetium' },
                        json: true
                    }, function(error, response, body) {
                        if(!error && response.statusCode === 200) {
                            // build array of issue numbers to get events for
                            for(var issueIndex = 0; issueIndex < body.length; issueIndex++) {
                                // if the issue was not generated by a pull request, save this issue number for future processing
                                if(!body[issueIndex].pull_request) {
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
                                        url: 'https://api.github.com/repos/' + req.query.owner + '/' + req.query.repo + '/issues/' + number + '/events' + '?' + 'client_id=' + config.CLIENT_ID + '&' + 'client_secret=' + config.CLIENT_SECRET,
                                        headers: { 'user-agent' : 'git-technetium' },
                                        json: true
                                    }, function(error, response, body) {
                                        if(!error && response.statusCode === 200) {
                                            for(var eventData = 0; eventData < body.length; eventData++) {
                                                if(body[eventData].event === 'closed') {
                                                    for(contributorIndex = 0; contributorIndex < contributors.length; contributorIndex++) {
                                                        if(body[eventData].actor.login === contributorIssuesClosed[contributorIndex].name) {
                                                            contributorIssuesClosed[contributorIndex].issues_closed++;
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        // If we have processed all the requests, we send a callback with the data attached.
                                        // According to the documentation, if you send callback() with anything inside,
                                        // it gets reported as an error. Conveniently, we can use this to our advantage.
                                        // When all requests are done, send the data through a callback to access it at
                                        // the end, and send it up to the server.
                                        if(issueNumbers.indexOf(number) === issueNumbers.length - 1) {
                                            res.send(contributorIssuesClosed);
                                        }
                                    });
                                }, function(err) {
                                    // We can access the data processed by async.each through the error callback.
                                    if(err) {
                                        res.send(err.data);
                                    } else {
                                        console.log('Done');
                                    }
                                });
                            } else {
                                // We are not done yet, there might be more data to grab. Call the function again with the next page.
                                getData(pageCounter + 1);
                            }
                        }
                    });
                };
                getData(1);
            }
        });
    });
};

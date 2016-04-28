var callbacks = [];
var app = angular.module('gitapp', [ 'ngSanitize' ]);
var scope;

app.factory('git', function() {

  var service = {};

  service.branch = function(fn) {
	  callGitWrapper({ callback: fn, command: 'branch', title: 'Git branch' });
  };

  service.status = function(fn) {
    callGitWrapper({ callback: fn, command: 'status', title: 'Git status' });
  };

  service.init = function(fn) {
    callGitWrapper({ callback: fn, command: 'init', title: 'Git init' });
  };

  service.addFile = function(file, fn) {
    callGitWrapper({ callback: fn, command: 'addFile', title: 'Git add file', params: { file: file } });
  };

  service.addAll = function(fn) {
    callGitWrapper({ callback: fn, command: 'addAll', title: 'Git add all files' });
  };

  service.revertFile = function(file, fn) {
    callGitWrapper({ callback: fn, command: 'revertFile', title: 'Git revert file', params: { file: file } });
  };

  service.revertAll = function(fn) {
    callGitWrapper({ callback: fn, command: 'revertAll', title: 'Git revert all files' });
  };

  service.commit = function(message, fn) {
    callGitWrapper({ callback: fn, command: 'commit', title: 'Git commit', params: { message: message } });
  };

  service.unstageFile = function(file, fn) {
    callGitWrapper({ callback: fn, command: 'unstageFile', title: 'Git unstage file', params: { file: file } });
  };

  service.unstageAll = function(fn) {
     callGitWrapper({ callback: fn, command: 'unstageFile', title: 'Git unstage all files' });
  };

  service.addRemote = function(remote, url, fn) {
     callGitWrapper({ callback: fn, command: 'addRemote', title: 'Git add new remote', params: {
       remote: remote,
       url: url
     }});
  };

	service.removeRemote = function(remote, fn) {
    callGitWrapper({ callback: fn, command: 'removeRemote', title: 'Git remove remote', params: { remote: remote } });
	};

  service.getRemotes = function(fn) {
     callGitWrapper({ callback: fn, command: 'getRemotes', title: 'Git get remotes' });
  };

  service.push = function(remote, localBranch, remoteBranch, fn) {
    callGitWrapper({ callback: fn, command: 'push', title: 'Git push', params: {
      remote: remote,
      localBranch: localBranch,
      remoteBranch: remoteBranch
    }});
  };

  service.pull = function(remote,localBranch, remoteBranch, fn) {
    callGitWrapper({ callback: fn, command: 'pull', title: 'Git pull', params: {
      remote: remote,
      localBranch: localBranch,
      remoteBranch: remoteBranch
    }});
  };

  service.getBranches = function(fn) {
    callGitWrapper({ callback: fn, command: 'getBranches', title: 'Git get branches', params: { async: true } });
  };

  service.checkBranchName = function(branch, fn) {
    callGitWrapper({ callback: fn, command: 'checkBranchName', title: 'Git check branch name', params: { branch: branch } });
  };

  service.getRemoteBranches = function(fn) {
    callGitWrapper({ callback: fn, command: 'getRemoteBranches', title: 'Git get remote branches', params: { async: true } });
  };

  service.renameRemote = function(oldName, newName, fn) {
    callGitWrapper({ callback: fn, command: 'renameRemote', title: 'Git rename remote', params: {
      oldName: oldName,
      newName: newName
    }});
  };

  service.updateRemoteUrl = function(remote, url, fn) {
    callGitWrapper({ callback: fn, command: 'updateRemoteUrl', title: 'Git update remote url', params: {
      remote: remote,
      url: url
    }});
  };

  function callGitWrapper(args) {
    var fn = args.callback;
    args.params = args.params || {};

    studio.hideProgressBarOnStatusBar();
    studio.showProgressBarOnStatusBar('Executing ' + args.title + '...');
    callbacks.push(function(result) {
      studio.hideProgressBarOnStatusBar();
      studio.showMessageOnStatusBar(args.title + ' finished.');
      fn && fn(result);
    });
    runCommand(args.command, args.params);
  }

  return service;
});

app.controller('mainViewController', ['$scope', '$sce', '$timeout', 'git', function($scope, $sce, $timeout, git){
	scope = $scope;

	$scope.stage         = [];
	$scope.workingTree   = [];
	$scope.remotes       = [];
	$scope.busy          = false;
	$scope.noGit         = false;
	$scope.noRemotes     = true;
	$scope.remoteList    = false;
	$scope.remoteForm    = false;
	$scope.commitMessage = "";
	$scope.localBranch   = "";
	$scope.remoteBranch  = "";

  angular.element(document).ready(function () {
    var urlParams = parseStudioTabUrl(window.location.href);
    if(urlParams.fromDeploy === 'true') {
      $scope.viewDeploy();
    }
    function parseStudioTabUrl() {
      var url = window.location.href,
      params = {};

      if(url.split('?').length <= 1) {
        return params;
      }

      url.split('?').slice(1).join('?').split('&').forEach(function(element) {
        var arr = element.split('=');
        params[ arr.shift() ] = decodeURIComponent( arr.join('=') );
      });

      return params;
    }
  });

	$scope.getStatus = function(fn){
		git.status(function(result){

			if(result && result.error){
				if(result.error === "NOTGIT"){
					$scope.noGit = true;
				}
				return;
			}

			$scope.stage       = [];
			$scope.workingTree = [];

			var status = result.data;

			function getElementsFrom(from, to){
				for(var state in status[from]){
					var elements = status[from][state];

					elements.forEach(function(element){
						to.push({
							"class" : "element-" + state,
							"path" : element
						});
					});

				}
			}

			status && getElementsFrom("index", $scope.stage);
			status && getElementsFrom("workingTree", $scope.workingTree);

			if($scope.remoteList){
				$scope.getRemotes();
			}
		});
	};

	$scope.init = function(){
		git.init(function(){
			$scope.noGit = false;
			$scope.getStatus();
		});
	};

	$scope.addFile = function(file){
		git.addFile(file, function(){
			$scope.getStatus();
		});
	};

	$scope.addAll = function(){
		git.addAll(function(){
			$scope.getStatus();
		});
	};

	$scope.revertFile = function(file){
		if(confirm("If you proceed, the changes to the selected file will be lost.")){
			git.revertFile(file, function(){
				$scope.getStatus();
			});
		}
	};

	$scope.revertAll = function(){
		if($scope.stage.length > 0){
			alert("You must first commit or unstage your staged changes.");
			return;
		}

		if(confirm("If you proceed, all your changes will be lost.")){
			git.revertAll(function(){
				$scope.getStatus();
			});
		}
	};

	$scope.unstageFile = function(file){
		git.unstageFile(file, function(){
			$scope.getStatus();
		});
	};

	$scope.unstageAll = function(){
		git.unstageAll(function(){
			$scope.getStatus();
		});
	};

	$scope.commit = function(){
		if(!$scope.commitMessage){
			alert("You must enter a commit message.");
			return;
		}

    $scope.disableCommit = true;
		git.commit($scope.commitMessage, function(){
      $scope.disableCommit = false;
			$scope.commitMessage = "";
			$scope.getStatus();
		});
	};

	$scope.getRemotes = function() {
		git.getRemotes(function(result){
			$scope.remotes   = [];

			if(! result || ! result.data){
				$scope.noRemotes = true;
				return;
			}

      $scope.noRemotes = false;
      $scope.remotes = parseRemotes(result);
      $scope.getBranches();
		});
  };

  $scope.clearRemoteForm = function() {
    ['newRemoteName', 'newRemoteURL', 'newRemoteUser', 'newRemotePassword',
      'newRemoteNameMsg', 'newRemoteURLMsg'].forEach(function(elm) {
      $scope[elm] = undefined;
    });
    $scope.setGitError('remoteError', undefined);
  };

  $scope.addRemote = function(remote, url, username, password) {
    $scope.disableRemote = true;
    git.addRemote(remote, getRemoteUrl(url, username, password), function(result) {
      $scope.disableRemote = false;
      if(result.isError) {
        $scope.setGitError('remoteError', result.data);
      } else {
        $scope.clearRemoteForm();
        $scope.closeRemote();
        $scope.getRemotes();
        $scope.displayNotif('Add remote ' + remote + ' has been successfully completed.');
      }
    });
  };

  $scope.closeRemote = function() {
    $scope.remoteForm = false;
    $scope.clearRemoteForm();
  };

  $scope.closeRemoteList = function() {
    $scope.remoteList = false;
  }

	$scope.removeRemote = function(remote){
		git.removeRemote(remote, function(){
			$scope.getRemotes();
		});
	};

    $scope.updateRemote = function(remote, url, username, password) {
      var currentRemote = $scope.currentRemote,
        newRemote = {
          name: $scope.newRemoteName,
          url: $scope.newRemoteURL,
          user: $scope.newRemoteUser,
          password: $scope.newRemotePassword
        },
        properties = {};

      Object.keys(newRemote).forEach(function(prop) {
        if(currentRemote[prop] !== newRemote[prop]) {
          properties[prop] = true;
        }
      });

      if(! Object.keys(properties).length) {
        $scope.displayNotif('There is no change for the remote ' + currentRemote.name + '.');
        $scope.closeRemote();
        return;
      }

      $scope.disableRemote = true;
      $scope.setGitError('remoteError', undefined);
      if(properties.name) { // update only the remote name
        // update remote name
        git.renameRemote(currentRemote.name, newRemote.name, function(result) {
          if(result.isError) {
            $scope.setGitError('remoteError', result.data);
            $scope.disableRemote = false;
          } else {
            updateRemoteUrl(newRemote.name);
          }
        });

      } else {
        updateRemoteUrl(currentRemote.name);
      }

      function updateRemoteUrl(remote) {
        if(properties.url || properties.user || properties.password) {
          var url = getRemoteUrl(newRemote.url, newRemote.user, newRemote.password);
          git.updateRemoteUrl(remote, url, function(result) {
            $scope.disableRemote = false;
            if(result.isError) {
              $scope.setGitError('remoteError', result.data);
            } else {
              // close update remote
              $scope.closeRemote();
              $scope.getRemotes();
              $scope.displayNotif('Remote ' + newRemote.name + ' is updated with success.');
            }
          });
        } else {
          $scope.disableRemote = false;
          $scope.closeRemote();
          $scope.getRemotes();
          $scope.displayNotif('Remote ' + newRemote.name + ' is updated with success.');
        }
      }
    };

    $scope.setGitError = function(name, message) {
      var element = document.getElementById(name);
      if(! element) {
        return;
      }
      element.innerHTML = message ? handleGitErrorOutPut(message) : '';
    };

    $scope.editRemote = function(remoteName) {
      $scope.clearRemoteForm();
      // get selected remote
      $scope.remotes.some(function(remote) {
        if(remote.name === remoteName) {
          $scope.currentRemote = remote;
          $scope.newRemoteName = remote.name;
          $scope.newRemoteURL = remote.url;
          $scope.newRemoteUser = remote.user;
          $scope.newRemotePassword = remote.password;
          return true;
        }
      });

      $scope.currentRemoteAction = 'update';
      $scope.remoteActionName = 'Update';
      $scope.remoteForm = true;
    };

    $scope.createOrUpdateRemote = function() {
      // validate remote form
      var isValid = true;
      if(! $scope.newRemoteName || $scope.newRemoteName.trim() === '') {
        $scope.newRemoteNameMsg = 'Name of the remote is mondatory';
        isValid = false;
      }

      if(! $scope.newRemoteURL || $scope.newRemoteURL.trim() === '') {
        $scope.newRemoteURLMsg = ' URL of the remote is mondatory';
        isValid = false;
      }

      if(! isValid) {
        return;
      }


      if($scope.currentRemoteAction === 'update') {
        $scope.updateRemote($scope.newRemoteName, $scope.newRemoteURL, $scope.newRemoteUser, $scope.newRemotePassword);
      } else {
        $scope.addRemote($scope.newRemoteName, $scope.newRemoteURL, $scope.newRemoteUser, $scope.newRemotePassword);
      }
    };

    $scope.$watch('remoteList', function(newValue, oldValue) {
      if(newValue) {
        $scope.getRemotes();
      }
    });

    $scope.getBranches = function(){
      git.getBranches(function(result){
      	$scope.branches   = [];

      	if(! result || ! result.data){
      	  return;
      	}

      	$scope.branches      = result.data.branches;
      	$scope.currentBranch = result.data.currentBranch;

      	$scope.localBranch = $scope.remoteBranch = result.data.currentBranch;
      });
    };

    $scope.getStatus();

    $scope.closePush = function() {
      if($scope.pushForm) {
        $scope.clearPushForm();
        $scope.pushForm = false;
      }
    };

    $scope.viewDeploy = function() {
      $scope.fViewPushForm(true);
    };

    $scope.clearPushForm = function() {
      $scope.remote = $scope.localBranch = $scope.remoteBranch = undefined;
      ['remote', 'localBranch', 'remoteBranch',
        'remoteMsg', 'localBranchMsg', 'remoteBranchMsg'
      ].forEach(function(elem) {
        $scope[elem] = undefined;
      });
      $scope.setGitError('pushError', undefined);
    };

    $scope.fViewPushForm = function(fromDeploy) {
      $scope.pushForm = true;
      $scope.fromDeploy = !! fromDeploy;
      $scope.pendingRemoteAction = 'push';

      $scope.remoteForm = $scope.remoteList = false;

      $scope.closePull();
      $scope.clearPushForm();

      if($scope.fromDeploy) {
        // waiting to default action git status finish
        var interval = setInterval(function() {
          if(! $scope.busy) {
            clearInterval(interval);
            $scope.populatePushForm();
          }
        }, 100);
      } else {
        $scope.populatePushForm();
      }
    };

    $scope.clearPullForm = function() {
      ['remote', 'localBranch', 'remoteBranch',
        'remoteMsg', 'remoteBranchMsg'].forEach(function(elem) {
        $scope[elem] = undefined;
      });
      $scope.setGitError('pullError', undefined);
    };

    $scope.closePull = function() {
      if($scope.pullForm) {
        $scope.clearPullForm();
        $scope.pullForm = false;
      }
    };

    $scope.fViewPullForm = function() {
      $scope.pullForm = true;
      $scope.pendingRemoteAction = 'pull';

      $scope.closePush();
      $scope.remoteForm = $scope.remoteList = false;

      $scope.clearPullForm();

      $scope.populatePullForm();
    };

    $scope.fViewAddRemote = function() {
      $scope.remoteForm = $scope.remoteList = true;
      $scope.closePush();

      $scope.closePull();
      $scope.closePush();
      $scope.remoteActionName = 'Create';
      $scope.currentRemoteAction = 'create';

      $scope.clearRemoteForm();
    };

    $scope.fViewRemotes = function() {
      $scope.remoteList = true;
      $scope.closePush();
      $scope.closePull();
      $scope.remoteForm = false;
    };

    $scope.populatePullForm = function() {
      $scope.remoteBranches = [];
      $scope.remotes = [];
      $scope.branches = [];

      git.getRemotes(function(result) {
        $scope.remotes = parseRemotes(result);

        git.getRemoteBranches(function(result) {
          $scope.remoteBranches = result && result.data ? result.data.branches : [];

          // get current branch
          git.getBranches(function(result) {
            $scope.localBranch = result && result.data ? result.data.currentBranch : undefined;
          });
        });
      });

    };

    $scope.populatePushForm = function() {
      git.getRemotes(function(result) {
        $scope.remotes = parseRemotes(result);

        git.getBranches(function(result) {
          $scope.branches = result && result.data ? result.data.branches : [];
          setDefaultValues();
        });
      });

      function setDefaultValues() {
        if(! $scope.fromDeploy) {
          return;
        }

        // get last deploy informations
        var infos = {
          remote: studio.extension.getSolutionSetting('git.remote'),
          localBranch: studio.extension.getSolutionSetting('git.localBranch'),
          remoteBranch: studio.extension.getSolutionSetting('git.remoteBranch')
        };

        $scope.remotes.some(function(remote) {
          if(remote.name === infos.remote) {
            $scope.remote = remote;
          }
        });

        if($scope.branches.indexOf(infos.localBranch) !== -1) {
          $scope.localBranch = infos.localBranch;
        }

        $scope.remoteBranch = infos.remoteBranch;
      }
    };

    $scope.displayNotif = function(message, callback) {
      var notif =  document.getElementById('notif');
      notif.style.display = 'block';

      $timeout(function () {
        notif.style.opacity = 1;
        $scope.notifMessage = message;
        $timeout(function () {
          $scope.closeNotif();
        }, 6000);
      }, 50);
    };

    $scope.closeNotif = function() {
      $scope.notifMessage = undefined;
      var notif =  document.getElementById('notif');
      notif.style.opacity = 0;
      notif.style.display = 'none';
    };

    $scope.doPush = function() {
      var remote = $scope.remote,
        localBranch = $scope.localBranch,
        remoteBranch = $scope.remoteBranch;

      $scope.setGitError('pushError', undefined);

      // remote repository
      $scope.remoteMsg = remote ? '' : 'You must select a remote repository';

      // local branch
      $scope.localBranchMsg = localBranch ? '' : 'You must select a local branch';

      // remote branch
      if(! remoteBranch) {
        $scope.remoteBranchMsg = 'Remote branch must be completed and be valid';
      } else {

        $scope.disablePush = true;
        git.checkBranchName(remoteBranch, function(result) {
          if(result.data.replace(/(\r\n|\n|\r)$/, '') !== remoteBranch) {
            $scope.remoteBranchMsg = 'Remote branch must be completed and be valid';
          }

          if($scope.remoteMsg || $scope.localBranchMsg || $scope.remoteBranchMsg) {
            $scope.disablePush = false;
            return;
          } else {
            git.push(remote.name, localBranch, remoteBranch, function(result) {
              $scope.disablePush = false;
              if(result.isError) {
                $scope.setGitError('pushError', result.data);
              } else {
                $scope.closePush();
                $scope.displayNotif('Push to remote ' + remote.name + ' has been successfully completed.');
              }
            });

            // save user push informations
            savePushValues();
          }
        });
      }

      function savePushValues() {
        if(! $scope.fromDeploy) {
          return;
        }
        studio.extension.setSolutionSetting('git.remote', remote.name);
        studio.extension.setSolutionSetting('git.localBranch', localBranch);
        studio.extension.setSolutionSetting('git.remoteBranch', remoteBranch);
      }
    };

    $scope.doPull = function() {
      var remote = $scope.remote,
        remoteBranch = $scope.remoteBranch,
        localBranch = $scope.localBranch;

      $scope.setGitError('pullError', undefined);

      // remote repository
      $scope.remoteMsg = remote ? '' : 'You must select a remote repository';

      // remote branch
      $scope.remoteBranchMsg = remoteBranch ? '' : 'You must select a remote repository';

      if(! remote || ! remoteBranch) {
        return;
      }

      $scope.disablePull = true;
      git.pull(remote.name, localBranch, remoteBranch, function(result) {
        $scope.disablePull = false;
        if(result.isError) {
          $scope.setGitError('pullError', result.data);
        } else {
          $scope.closePull();
          $scope.displayNotif('Pull from remote ' + remote.name + ' has been successfully completed.');
        }
      });
    };

    $scope.selectRemoteBranches = function() {
      var remote = $scope.remote ? $scope.remote.name : undefined,
        remoteBranches = $scope.remoteBranches || [],
        branches = [],
        token = remote + '/';

      if(! remote) {
        $scope.branches = [];
        return;
      }

      remoteBranches.forEach(function(branch) {
        if(branch.indexOf(token) === 0) {
          branches.push(branch.substr(token.length));
        }
      });
      $scope.branches = branches;
    };

    function parseRemotes(result) {
      var remotes = [];
      if(! result || ! result.data) {
        return remotes;
      }
      var data = result.data;
      for(var remoteName in data) {
        var remote = {};
        remote.name     = remoteName;
        remote.fetchURL = data[remoteName].fetch;
        remote.pushURL  = data[remoteName].push;

        // parse url to get username
        var parseUrl = _parseUrl(data[remoteName].fetch);
        remote.user = parseUrl.user;
        remote.password = parseUrl.password;
        remote.url = parseUrl.url;

        remotes.push(remote);
      }

      return remotes;

      function _parseUrl(url) {
        var result = {},
          regex = /\/\/([^@]+@)/;

        // url is https://_user:_passwd@url or https://url
        var arr = regex.exec(url);
        if(arr && arr.length > 1) {
          var userInfo = arr[1].slice(0, -1).split(':');
          result.user = decodeURIComponent(userInfo[0]);
          result.password = userInfo.length > 1 ? decodeURIComponent(userInfo[1]) : undefined;
          result.url = url.replace(arr[1], '');
        } else {
          result.user = result.password = undefined;
          result.url = url;
        }
        return result;
      }
    }
}]);

function runCommand(command, params){
	if(scope.busy){
		alert("A command is still executing!");
		return;
	}
	scope.busy = true;
	studio.setPreferences("git.done", "false");
	studio.sendCommand('git.' + command, JSON.stringify(params || {}));
}

function poll(message){
	var result = JSON.parse(message);

	scope.busy = false;
	var callback = callbacks.pop();
	callback && callback(result);

	try{
		scope.$digest();
	}catch(e){
		setTimeout(scope.$digest,0);
	}
}

function focusElement(id){
	setTimeout(function(){
		document.getElementById(id).focus();
	}, 0);
}

function onMessage(message){
	poll(message);
}

function viewDeploy() {
    var scope = angular.element(
       document.
       getElementById("mainViewController")).
       scope();
       scope.$apply(function () {
           scope.viewDeploy();
       });
}

function handleGitErrorOutPut(output) {
  var errors = (output || '').split(/\r\n|\r|\n/).map(function(row) {
    // hide password in the url
    row = row.replace(/'(.*\/\/(.+)):(.+)(@[^@]+)'/, "'$1:*****$4'");
    if(row !== '') {
      return row;
    }
  });

  // filter empty rows
  errors = errors.filter(function(row) { return row !== undefined && row !== ''; });

  // truncate errors
  var trunc = false;
  if(errors.length > 5) {
    errors = errors.slice(0, 4);
    trunc = true;
  }

  var row = errors.pop();
  row += trunc ? '... ' : ' ';
  row += '<a href="#" onClick="openConsole();">Open the Console &raquo;</a>';
  errors.push(row);

  return errors.join('<br>');
}

function getRemoteUrl(url, username, password) {
  if(! url) {
    return;
  }

  url = url.trim();

  var tmp = url.split("://");
  var protocol      = tmp.length === 2 ? tmp[0] : "https";
  var urlNoProtocol = tmp.length === 2 ? tmp[1] : tmp[0];

  url = protocol + "://";
  url += username ? encodeURIComponent(username) : "";
  url += password ? ":" + encodeURIComponent(password) : "";
  url += username ? "@" + urlNoProtocol : urlNoProtocol;

  return url;
}

function openConsole() {
  studio.sendCommand('wakanda-extension-mobile-console.open');
}

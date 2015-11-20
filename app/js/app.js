var callbacks = [];
var app = angular.module('gitapp', []);
var scope;

app.factory('git', function() {
  var service = {};
  
  service.branch = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("branch");
  }
  
  service.status = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("status");
  }
  
  service.init = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("init");
  }
  
  service.addFile = function(file, fn){
	  callbacks.push(fn);
	  
	  runCommand("addFile", {
		  "file" : file
	  });
  };
  
  service.addAll = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("addAll");
  };
  
  service.revertFile = function(file, fn){
	  callbacks.push(fn);
	  
	  runCommand("revertFile", {
		  "file" : file
	  });
  };
  
  service.revertAll = function( fn){
	  callbacks.push(fn);
	  
	  runCommand("revertAll");
  };
  
  service.commit = function(message, fn){
	  callbacks.push(fn);
	  
	  runCommand("commit", {
		  "message" : message
	  });
  };
  
   service.unstageFile = function(file, fn){
	  callbacks.push(fn);
	  
	  runCommand("unstageFile", {
		  "file" : file
	  });
  };
  
   service.unstageAll = function( fn){
	  callbacks.push(fn);
	  
	  runCommand("unstageAll");
  };
  
   service.addRemote = function(remote, url, fn){
	  callbacks.push(fn);
	  
	  runCommand("addRemote", {
		  "remote" : remote,
		  "url" : url
	  });
  };
  
	service.removeRemote = function(remote, fn){
		callbacks.push(fn);
		
		runCommand("removeRemote", {
			"remote" : remote
		});
	};
  
   service.getRemotes = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("getRemotes");
  };
  
  service.push = function(remote,localBranch, remoteBranch, fn){
	  callbacks.push(fn);
	  
	  runCommand("push", {
		  "remote" : remote,
		  "localBranch" : localBranch,
		  "remoteBranch" : remoteBranch
	  });
  };
  
  service.pull = function(remote,localBranch, remoteBranch, fn){
	  callbacks.push(fn);
	  
	  runCommand("pull", {
		  "remote" : remote,
		  "localBranch" : localBranch,
		  "remoteBranch" : remoteBranch
	  });
  };
  
  service.getBranches = function(fn){
	  callbacks.push(fn);
	  
	  runCommand("getBranches",{
		  "async" : true
	  });
  };
  
  return service;
});

app.controller("mainViewController", ["$scope", "git", function($scope, git){
	scope = $scope;
	
	$scope.stage         = [];
	$scope.workingTree   = [];
	$scope.remotes       = [];
	$scope.busy          = false;
	$scope.noGit         = false;
	$scope.noRemotes     = true;
	$scope.viewRemotes   = false;
	$scope.viewAddRemote = false;
	$scope.commitMessage = "";
	$scope.localBranch   = "";
	$scope.remoteBranch  = "";
	
	$scope.getStatus = function(fn){
		git.status(function(result){
			
			if(result && result.error){
				if(result.error === "NOTGIT"){
					$scope.noGit = true;
				}				
				return;	
			};
			
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
			
			if($scope.viewRemotes){
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
		
		git.commit($scope.commitMessage, function(){
			$scope.commitMessage = "";
			$scope.getStatus();
		});
	};
	
	$scope.getRemotes = function(){
		git.getRemotes(function(result){
			$scope.remotes   = [];			
			
			if(! result || ! result.data){
				$scope.noRemotes = true;
				return;
			}
			
			$scope.noRemotes = false;
			
			var data = result.data;			
			
			for(var remoteName in data){
				var remote = {};
				
				remote.name     = remoteName;
				remote.fetchURL = data[remoteName].fetch;
				remote.pushURL  = data[remoteName].push;
				
				$scope.remotes.push(remote);
			}
			
			$scope.getBranches();
		});
	};
	
	$scope.addRemote = function(remote, url, username, password){
		url = url.trim();
		
		var tmp = url.split("://");
		var protocol      = tmp.length === 2 ? tmp[0] : "https";
		var urlNoProtocol = tmp.length === 2 ? tmp[1] : tmp[0];
		
		url = protocol + "://";
		url += username ? encodeURIComponent(username) : "";
		url += password ? ":" + encodeURIComponent(password) : "";
		url += username ? "@" + urlNoProtocol : urlNoProtocol;
		
		git.addRemote(remote, url, function(){
			$scope.newRemoteName     = "";
			$scope.newRemoteURL      = "";
			$scope.newRemoteUser     = "";
			$scope.newRemotePassword = "";
			
			$scope.toggleAddRemote();
			$scope.getRemotes();
		});
	};
	
	$scope.removeRemote = function(remote){
		git.removeRemote(remote, function(){
			$scope.toggleRemoteActionView();
			$scope.getRemotes();
		});
	};
	
	$scope.$watch("viewRemotes", function(newValue, oldValue){
		$scope.toggleRemoteActionView();
		if(newValue){
			$scope.getRemotes();
		}		
	});
	
	$scope.toggleAddRemote = function(){
		$scope.viewAddRemote = ! $scope.viewAddRemote;
		
		$scope.viewAddRemote && focusElement("addRemoteFirstInput");
	};
	
	$scope.push = function(remote, localBranch, remoteBranch, fn){
		git.push(remote, localBranch, remoteBranch, fn);
	};
	
	$scope.pull = function(remote, localBranch, remoteBranch, fn){
		git.pull(remote, localBranch, localBranch, fn);
	};
	
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
	
	$scope.viewPush = function(remoteName){
		$scope.toggleRemoteActionView(remoteName, "push");
		$scope.pendingRemoteAction      = "push";
		$scope.pendingRemoteActionTitle = "Push";				
	};
	
	$scope.viewPull = function(remoteName){		
		$scope.toggleRemoteActionView(remoteName, "pull");
		$scope.pendingRemoteAction      = "pull";
		$scope.pendingRemoteActionTitle = "Pull";
	};
	
	$scope.toggleRemoteActionView = function(remoteName, action){
		if( ! remoteName || ($scope.currentRemote === remoteName && action === $scope.pendingRemoteAction) ){
			$scope.currentRemote = "";
		} else {
			$scope.currentRemote = remoteName;
		}
	};
	
	$scope.remoteAction = function(remoteAction, remoteName, localBranch, remoteBranch){
		$scope[remoteAction](remoteName, localBranch, remoteBranch, function(){
			$scope.toggleRemoteActionView();
		});
	};
	
	$scope.getStatus();
}]);

function runCommand(command, params){
	if(scope.busy){
		alert("A command is still executing!");
		return;
	}
	scope.busy = true;
	var studioAction;
	var base64json;
	var strParams;
	
	if(params){
		strParams = JSON.stringify(params);
		base64json = btoa(strParams); // bota() is only available on webviews.
		studioAction = "git." + command + "." + base64json;
	} else {
		studioAction = "git." + command;
	}	
	
	studio.setPreferences("git.done", "false");
	studio.sendCommand(studioAction);
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
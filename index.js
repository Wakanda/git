var Git         = {};
var shellWorker = require("shellWorker");
var commands    = {
	"init"         : "init", //added to UI
	"commit"       : 'commit -m "{{message}}"', //added to UI
	"addFile"      : 'add "{{file}}"', //added to UI
	"revertFile"   : 'checkout "{{file}}"', //added to UI
	"revertAll"    : 'checkout --force', //added to UI
	"unstageFile"  : 'reset -- "{{file}}"', //added to UI
	"unstageAll"   : 'reset', //added to UI
	"addAll"       : "add -A", //added to UI
	"push"         : 'push "{{remote}}" {{localBranch}}:{{remoteBranch}}', //added to UI
	"pull"         : 'pull "{{remote}}" {{remoteBranch}}:{{localBranch}}', //added to UI
	"getRemotes"   : "remote -v", //added to UI
	"addRemote"    : 'remote add "{{remote}}" "{{url}}"', //added to UI
	"renameRemote" : 'remote rename "{{oldName}}" "{{newName}}"',
	"removeRemote" : 'remote rm "{{remote}}"', //added to UI
	"status"       : "status --porcelain -z", //added to UI
	"getBranches"  : "branch --no-color",
	"createBranch" : 'checkout -b "{{branch}}"',
	"changeBranch" : 'checkout "{{branch}}"',
	"deleteBranch" : 'branch -d "{{branch}}"'
};
var sync       = false;
var errors     = {
	"NOTGIT" : "NOTGIT"
};
var gitPath    = getGitPath();
var actionsParsers = {};
var workingDirectory;

Git.runCommand = function(options){
	var command      = options.cmd;
	var params       = options.params;
	var onmessage    = options.onmessage;
	var onerror      = options.onerror;
	var onterminated = options.onterminated;
	var variables    = [];
	
	params.dir = workingDirectory.path;
	params.git = gitPath;
	
	command = '"{{git}}" --git-dir "{{dir}}.git" --work-tree "{{dir}}" ' + command;
	
	for(var i in params){
		variables.push({
			"variable" : i,
			"value" : params[i]
		});
	}
	
	command = replacePatterns(command, variables);
	
	var sw = shellWorker.create(command);
	
	sw.onmessage    = onmessage;
	sw.onerror      = onerror;
	sw.onterminated = onterminated;
	
	return sw;	
};

Git.runGitAction = function(options){

	function handleActionData(data){
		if(actionsParsers[options.action]){
			data = actionsParsers[options.action](data, options.params);
			
			return data;
		} else {
			return data;
		}		
	}
	
	function handleActionError(error){
		return error;
	}
	
	var data   = "";
	var error  = "";

	var cmd     = getCmdFromAction(options.action);
	var params  = options.params || {};
	
	var onmessage    = options.onmessage || function(message){
		data += message;
	};
	var onerror      = options.onerror || function(message){
		data += message;
	};
	var onterminated = options.onterminated || function(message){
		var errorResponse;
		var dataResponse;
		var response = {};
		
		if(error){
			errorResponse = handleActionError(error);
		}
		
		if(data){
			dataResponse = handleActionData(data);
		}
		
		response.error = errorResponse;
		response.data  = dataResponse;
		
		studio.log(data);
		studio.log(error);
		
		if(sync){
			exitWait();			
			studio.extension.sendDataToWakandaStudio('git.getGitBranchNames', response.data);
			sync = false;
		} else{
			sendResponse(response);
		}
		
	};
	
	var result = Git.runCommand({
		"cmd" : cmd,
		"params" : params,
		"onmessage" : onmessage,
		"onerror" : onerror,
		"onterminated" : onterminated		
	});
	
	return result;
};

/*
 * check for a correct working directory
 */

Git.status = function(){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
		
	var result = Git.runGitAction({
		"action" : "status"
	});
	
	return result;
};

Git.getRemotes = function(){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
		
	var result = Git.runGitAction({
		"action" : "getRemotes"
	});
	
	return result;
};

Git.isGitRepository = Git.isGitReadyForCurrentSolution = function(){
	studio.extension.sendDataToWakandaStudio('git.isGitReadyForCurrentSolution', isGitRepository());
};

Git.changeBranch = Git.gitSwitchBranch = function(){
	var branch = studio.extension.getDataFromWakandaStudio('git.gitSwitchBranch');
	
	var result = Git.runGitAction({
		"action" : "changeBranch",
		"params" : {
			"branch" : branch
		}
	});
	studio.extension.sendDataToWakandaStudio('git.gitSwitchBranch', true);
};

Git.getBranches = Git.getGitBranchNames = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "getBranches"
	});
	
	if(!params || typeof params.async === "undefined"){
		sync = true;
		wait(2000);
	}
	
	return result;
};

Git.addFile = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "addFile",
		"params" : {
			"file" : params.file
		}
	});
	
	return result;
};

Git.addAll = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "addAll"
	});
	
	return result;
};

Git.unstageAll = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "unstageAll"
	});
	
	return result;
};

Git.revertFile = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "revertFile",
		"params" : {
			"file" : params.file
		}
	});
	
	return result;
};

Git.revertAll = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "revertAll"
	});
	
	return result;
};

Git.unstageFile = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "unstageFile",
		"params" : {
			"file" : params.file
		}
	});
	
	return result;
};

Git.changeBranch = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "changeBranch",
		"params" : {
			"branch" : params.branch
		}
	});
	
	return result;
};

Git.createBranch = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "createBranch",
		"params" : {
			"branch" : params.branch
		}
	});
	
	return result;
};

Git.deleteBranch = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "deleteBranch",
		"params" : {
			"branch" : params.branch
		}
	});
	
	return result;
};

Git.commit = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}
	
	var result = Git.runGitAction({
		"action" : "commit",
		"params" : {
			"message" : params.message
		}
	});
	
	return result;
};

Git.push = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}	
	
	var result = Git.runGitAction({
		"action" : "push",
		"params" : {
			"remote" : params.remote,
			"localBranch" : params.localBranch,
			"remoteBranch" : params.remoteBranch,
		}
	});
	
	return result;
};

Git.pull = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}	
	
	var result = Git.runGitAction({
		"action" : "pull",
		"params" : {
			"remote" : params.remote,
			"localBranch" : params.localBranch,
			"remoteBranch" : params.remoteBranch,
		}
	});
	
	return result;
};

Git.addRemote = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}	
	
	var result = Git.runGitAction({
		"action" : "addRemote",
		"params" : {
			"remote" : params.remote,
			"url" : params.url
		}
	});
	
	return result;
};

Git.renameRemote = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}	
	
	var result = Git.runGitAction({
		"action" : "renameRemote",
		"params" : {
			"oldName" : params.oldName,
			"newName" : params.newName
		}
	});
	
	return result;
};

Git.removeRemote = function(params){
	if(!isGitRepository()){
		return errorMessage("NOTGIT");
	}	
	
	var result = Git.runGitAction({
		"action" : "removeRemote",
		"params" : {
			"remote" : params.remote
		}
	});
	
	return result;
};

/*
 * No need for working directory
 */

Git.init = function(){
	var result = Git.runGitAction({
		"action" : "init"
	});
	
	return result;
};

Git.clone = function(params){
	
};

/*
 * Studio Actions
 */

Git.open = function(){
	if(!workingDirectory){
		studio.alert("No solution is open");
		return;
	}
	studio.extension.openPageInTab('./index.html', 'Git', true, "side");
}

Git.initPreferences = function(){
	studio.extension.registerPreferencePanel('GIT', 'preferences.html', 400);
	studio.extension.registerTabPage("./index.html", './icon_small.png');
}

Git.refreshPath = function(){
	gitPath = getGitPath();
};

/*
 * Internal functions
 */

function isGitRepository(){
	workingDirectory = getWorkingDirectory();
	
	if(Folder(workingDirectory, ".git").exists){
		return true;
	} else {
		return false;
	}
}

function getWorkingDirectory(){
	if(!studio.currentSolution){
		return null;
	}
	
	var solutionFile = studio.currentSolution.getSolutionFile();
	
	if(!solutionFile){
		return null;
	}
	
	return solutionFile.parent.parent;
}

function getCmdFromAction(action){
	return commands[action];
}

function errorMessage(code){
	return {
		"error" : code,
		"message" : errors[code] || ""
	};
}

function dataMessage(result){
	return {
		"data" : result
	};
}

function sendResponse(response){
	studio.setPreferences("git.result", JSON.stringify(response));
	studio.setPreferences("git.done", "true");
}

function getGitPath(){
	
	var pathFromPref = studio.getPreferences('git.path');
	var path         = "";
	
	if(!pathFromPref){
		path = os.isWindows ? "C:\\Program Files (x86)\\Git\\bin\\git.exe" : "git";
		studio.setPreferences('git.path',path);
	} else {
		path = pathFromPref;
	}
	
	return path;
}

exports.handleMessage = function handleMessage(message){
    var action      = message.action;
    if( action ) {
        var result = Git[action](message.params);
		
		if(result && result.error){
			sendResponse(result);
		}
		
        return result;
    }
    else {
        return false;
    }
};

function replacePatterns(template, list)
{
	var output = template;

	list.forEach(function(element){
		output = replacePattern(output, element.variable, element.value);
	});

	return output;
};

function replacePattern(template, variable, value)
{
	return template.replace(new RegExp("\\{\\{"+variable+"\\}\\}", "g"), value);
}

actionsParsers.status = function(data, params){
	var utils = require("git-utils");
	
	return utils.extractStatus(data, "\0");
};

actionsParsers.getRemotes = function(data){	
	var remotes    = {};
	var lines      = data.split("\n");
	
	lines.forEach(function(line){
		if(line.match(/^[\s\r\n]*$/)){
			return;
		}
		var parts = line.split(/\s+/);
		
		var name    = parts[0];
		var url     = parts[1];
		var purpose = parts[2].replace(/[\(\)]+/g, "");
		
		remotes[name] = remotes[name] || {};
		
		remotes[name][purpose] = url;		
	});
	
	return remotes;
};

actionsParsers.getBranches = function(data){
	var result = {};
	result.branches = [];
	
	var lines = data.split("\n");
	
	lines.forEach(function(line){
		if(line.match(/^[\s\r\n]*$/)){
			return;
		}
		var name;
		line = line.trim();
		
		if(line.indexOf("*") === 0){
			name = line.split(/\s/)[1]; //assert ?
			result.currentBranch = name;
			result.branches.push(name);
		} else {
			result.branches.push(line);
		}		
	});
	
	return result;
};
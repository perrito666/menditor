// Key Constants
var keyNewBoundNode = 78 //n
var keyNewUnboundNode = 85 //u
var keyGoToNextNode = 73 //i
var keyGoToPreviousNode = 75 //k
var keyEditNode = 69 //e

var keyTestSomething = 84 //t
var testVar = null

var nodes = []
var edges = []
var idCount = 0
var network = null
var currentEdition = {id:-1, title:"", body:"", attachments:[]}

var data = {
    nodes: nodes,
    edges: edges
};

var options = {
    nodes: {
        shape: 'dot',
        size: 30,
        font: {
            size: 15,
            color: '#ffffff'
        },
        borderWidth: 2
    },
    edges: {
        width: 4
    },
    groups: {
        diamonds: {
            color: {background:'red',border:'white'},
            shape: 'diamond'
        },
        dotsWithLabel: {
            shape: 'dot',
            color: {background: 'orange', border: 'red'}
        },
        mints: {color:'rgb(0,255,140)'},
        icons: {
            shape: 'icon',
            icon: {
                face: 'FontAwesome',
                code: '\uf0c0',
                size: 50,
                color: 'orange'
            }
        },
        source: {
            color:{border:'white'}
        }
    }
};

// httpGet is a simple helper to make a get call
// to a given url
function httpGet(theUrl, theCallback)
{
  var client = new XMLHttpRequest();
  client.onload = theCallback;
  client.open("GET", theUrl);
  client.send();
}

// loadSelectedForEdition loads the selected node information
// into the currentEdition object.
// returns true if loaded or false if not.
function loadSelectedForEdition() {
  var selected = network.getSelectedNodes();
  if (selected.length == 1) {
    var selectedNode = selected[0]
    loadForEdition({id: selectedNode})
    return true
  }
  return false
}

// loadForEdition loads the passed id into the currentEdition object.
function loadForEdition(params) {
  if (typeof(params) === undefined) {
    return 
  }
  if (!("id" in params)) {
    return
  }
  console.log("will load for "+params["id"]+" edition")
  currentEdition["id"] = network.body.nodes[params["id"]].id
  currentEdition["title"] = network.body.nodes[params["id"]].options.label
  // currentEdition["body"] = fetch from server
}

// saveEdition will persist currentEdition into its graph node and
// also send the data to the server.
// TODO(perrito666) timestamp this to avoid breakage.
function saveEdition() {
  network.body.nodes[currentEdition["id"]].objects.label = currentEdition["title"] 
  // currentEdition["body"] = push to server

}

// keyPressHandler is handles the shortcuts behavior.
function keyPressHandler(keyPressed){
  if ($('#editNodeModal').is(':visible')) {
    return
  }
  if ($('#nodeTitlePrompt').is(':visible')) {
    return
  }

  var selected = network.getSelectedNodes();
  switch (keyPressed.keyCode) {
    case keyNewUnboundNode:
      createUnboundNode(true)
      break;
    case keyNewBoundNode:
      createBoundNode(true)
      break; 
    case keyGoToNextNode:
      walkNodeFwd()
      break;
    case keyGoToPreviousNode:
      walkNodeBwd()
      break;
    case keyEditNode:
      editNode()
      break;
    case keyTestSomething:
      var handler = function(){
        $("#testplace").text(this.responseText)
        testVar = this
      }
      httpGet("/data/where/in/the/world", handler);
      break;
  }
}

// editNode edits loads currentEdition into a form and
// lets you edit it.
function editNode() {
  var loaded = loadSelectedForEdition()
  if (loaded) {
    $("#node_title").val(currentEdition["title"])
    $("#node_body").val(currentEdition["body"])
    $('#editNodeModal').on('shown.bs.modal', function () {
      $('#node_title').focus()
    });
    $("#editNodeModal").modal("show"); 
  }
}

// changeNode will Update the current node in Edition with
// the values from node edit form.
function changeNode() {
  if (currentEdition["id"]>-1) {
    currentEdition["title"] = $("#node_title").val()
    currentEdition["body"] = $("#node_body").val()
    commitNode()
  }
  $("#editNodeModal").modal("hide"); 
}

// changeTitle will Update the current node in Edition with
// the value from the title edit form.
function changeTitle() {
  if (currentEdition["id"] > -1) {
    currentEdition["title"] = $("#prompt_node_title").val()
    commitNodeTitle()
  }
  $("#nodeTitlePrompt").modal("hide"); 
}

// shiftEnter is called upon pressing a key
// in a text entry, it ignores all but Return and
// will call the passed executable if shift is held.
function shiftEnter (event, executable) {
    if (event.keyCode == 13) {
        var content = this.value;  
        if(event.shiftKey){
            executable();            
        } else {
            event.stopPropagation();
        }
    }
}

function createNetwork(container) {
  network = new vis.Network(document.getElementById(container), data, options);
  window.addEventListener('keyup',keyPressHandler);
  $('#node_body').keyup(function(event){shiftEnter(event, changeNode)});
  $('#node_title').keyup(function(event){shiftEnter(event, changeNode)});
  $('#prompt_node_title').keyup(function(event){shiftEnter(event, changeTitle)});
}

function walkNodeFwd() {
  var selected = network.getSelectedNodes();
  console.log(selected)
  console.log(idCount)
  if (selected.length == 1 && selected[0] < idCount -1) {
      console.log("step fwd")
      selected[0] ++;
  } else if (selected.length == 0) {
      console.log("stwp fwd to " + idCount-1)
      selected = [idCount-1]
  }
  network.selectNodes(selected)
}

function walkNodeBwd() {
  var selected = network.getSelectedNodes();
  if (selected.length == 1 && selected[0] > 0) {
      console.log("step bwd")
      selected[0] --;
  } else if (selected.length == 0) {
      console.log("step bwd to 0")
      selected = [0]
  }
  network.selectNodes(selected)
}

function createBoundNode(promptName) {
  var h = createUnboundNode(promptName);
  if (idCount > 1) {
      network.body.data.edges.add({from: h[0], to: h[1]})
  }
}

function createUnboundNode(promptName) {
  var selected = network.getSelectedNodes();
  var previousNode = 0
  if (idCount > 0) {
    previousNode = idCount-1
  }
  if (selected.length == 1) {
    previousNode = selected[0]
  }
  network.body.data.nodes.add({id: idCount, label: idCount, group: 'dotsWithLabel'})
  network.selectNodes([idCount])
  var highligteable = [previousNode, idCount]
  promptNodeTitle()
  idCount ++;
  return highligteable
}

function commitNode() {
  setNodeLabel()
  // TODO push title and body and attachments to server
}

function commitNodeTitle() {
  setNodeLabel()
  // TODO push title to server
}

function setNodeLabel() {
  var nodeId = currentEdition["id"]
  var newOptions = network.body.nodes[nodeId].options
  newOptions.label = currentEdition["title"]
  network.body.nodes[nodeId].setOptions(newOptions)
  network.redraw()
}

function promptNodeTitle() {
  loadSelectedForEdition()
  $("#prompt_node_title").val(currentEdition["title"])
  $('#nodeTitlePrompt').on('shown.bs.modal', function () {
    $('#prompt_node_title').focus()
  });
  $("#nodeTitlePrompt").modal("show"); 
}

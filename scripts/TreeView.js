/*
    STACK360 - Web-based Business Management System
    Copyright (C) 2024 Arahant LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses.
*/

/**
* Component for displaying TreeViews
* on the web.
*
*/

class TreeView {
	/** 
	* Constructor
	* Create a new TreeView instance
	*
	* @param root { treeNode }  the instance of TreeNode of the tree root
	* @param id {string} the ID of the div that represents the tree view
	* @param options { object } the objest that sets options of the tree view
	*
	*/
	constructor (root, id, options) {
		if (typeof root === "undefined") {
			throw new Error("Parameter 1 must be set (root)");
		}
	
		if (!(root instanceof TreeNode)) {
			throw new Error("Parameter 1 must be of type TreeNode");
		}

		if (id) {
			this.id = id;
			this.root = root;
			this.options = options;
			
			if (!TreeUtil.isDOM(id)) {
				this.container = document.querySelector('#' + id);
	
				if (this.container instanceof Array) {
					this.container = this.container[0];
				}
	
				if (!TreeUtil.isDOM(this.container)) {
					throw new Error("Parameter 2 must be either DOM-Object or CSS-QuerySelector (#, .)");
				}
			}
		} else {
			this.container = null;
		}
	
		if (!options || typeof options !== "object") {
			this.options = {};
		}
	}
	

	/*
	* Methods
	*/
	setRoot(_root) {
		if (root instanceof TreeNode) {
			this.root = _root;
			return this;
		}
	}

	getRoot() {
		return this.root;
	}

	expandAllNodes() {
		this.root.setExpanded(true);

		this.root.getChildren().forEach(function(child) {
			TreeUtil.expandNode(child);
		});
		return this;
	}

	expandPath(path) {
		if (!(path instanceof TreePath)) {
			throw new Error("Parameter 1 must be of type TreePath");
		}

		path.getPath().forEach(function(node) {
			node.setExpanded(true);
		});
		return this;
	}

	collapseAllNodes() {
		this.root.setExpanded(false);

		this.root.getChildren().forEach(function(child) {
			TreeUtil.collapseNode(child);
		});
		return this;
	}

	setContainer(_container) {
		if (TreeUtil.isDOM(_container)) {
			this.container = _container;
		} else {
			_container = document.querySelector(_container);

			if (_container instanceof Array) {
				_container = _container[0];
			}

			if (!TreeUtil.isDOM(_container)) {
				throw new Error("Parameter 1 must be either DOM-Object or CSS-QuerySelector (#, .)");
			}
		}
	}

	getContainer() {
		return this.container;
	}

	setOptions(_options) {
		if (typeof _options === "object") {
			this.options = _options;
		}
		return this;
	}

	changeOption(option, value) {
		this.options[option] = value;
		return this;
	}

	getOptions() {
		return this.options;
	}

	// TODO: set selected key: up down; expand right; collapse left; enter: open;
	getSelectedNodes() {
		return TreeUtil.getSelectedNodesForNode(this.root);
	}

	reload() {
		if (this.container === null) {
			console.warn("No container specified");
			return;
		}

		this.container.classList.add("tj_container");

		const cnt = document.createElement("ul");

		if (TreeUtil.getProperty(this.options, "show_root", true)) {
			cnt.appendChild(this.renderNode(this.root));
		} else {
			this.root.getChildren().forEach((child) => {
				cnt.appendChild(this.renderNode(child));
			});
		}

		this.container.innerHTML = "";
		this.container.appendChild(cnt);
	}

	renderNode(node) {
		let li_outer = document.createElement("li");
		let span_desc = document.createElement("div");
		span_desc.className = "tj_description";
		span_desc.tj_node = node;

		if (!node.isEnabled()) {
			li_outer.setAttribute("disabled", "");
			node.setExpanded(false);
			node.setSelected(false);
		}
		
		if (node.isSelected()) {
			span_desc.classList.add("selected");
		}

		span_desc.addEventListener("click", (e) => {
			let cur_el = e.target;

			while (typeof cur_el.tj_node === "undefined" || cur_el.classList.contains("tj_container")) {
				cur_el = cur_el.parentElement;
			}

			const node_cur = cur_el.tj_node;

			if (typeof node_cur === "undefined") {
				return;
			}

			if (node_cur.isEnabled()) {
				if (e.ctrlKey === false) {
					if (!node_cur.isLeaf()) {
						node_cur.toggleExpanded();
						this.reload();
					} else {
						node_cur.open();
					}

					node_cur.on("click")(e, node_cur);
				}


				if (e.ctrlKey === true) {
					node_cur.toggleSelected();
					this.reload();
				} else {
					const rt = node_cur.getRoot();

					if (rt instanceof TreeNode) {
						TreeUtil.getSelectedNodesForNode(rt).forEach(function(_nd) {
							_nd.setSelected(false);
						});
					}
					node_cur.setSelected(true);

					this.reload();
				}
			}
		});

		span_desc.addEventListener("contextmenu", function(e) {
			let cur_el = e.target;

			while (typeof cur_el.tj_node === "undefined" || cur_el.classList.contains("tj_container")) {
				cur_el = cur_el.parentElement;
			}

			const node_cur = cur_el.tj_node;

			if (typeof node_cur === "undefined") {
				return;
			}

			if (typeof node_cur.getListener("contextmenu") !== "undefined") {
				node_cur.on("contextmenu")(e, node_cur);
				e.preventDefault();
			} else if (typeof TreeConfig.context_menu === "function") {
				TreeConfig.context_menu(e, node_cur);
				e.preventDefault();
			}
		});

		if (node.isDocument() && !TreeUtil.getProperty(node.getOptions(), "forceParent", false)) {
			let ret = '';
			let icon = TreeUtil.getProperty(node.getOptions(), "icon", "");
			if (icon !== "") {
				ret += '<div class="tj_icon">' + icon + '</div>';
			} else if ((icon = TreeUtil.getProperty(this.options, "leaf_icon", "")) !== "") {
				ret += '<div class="tj_icon">' + icon + '</div>';
			} else {
				ret += '<div class="tj_icon">' + TreeConfig.leaf_icon + '</div>';
			}

			span_desc.innerHTML = ret + node.toString() + "</span>";
			span_desc.classList.add("tj_leaf");

			li_outer.appendChild(span_desc);
		} else {
			let ret = '';
			if (!node.isLeaf()) {
				if (node.isExpanded()) {
					ret += '<span class="tj_mod_icon">' + TreeConfig.open_icon + '</span>';
				} else {
					ret+= '<span class="tj_mod_icon">' + TreeConfig.close_icon + '</span>';
				}
			} else {
				ret += '<span class="tj_mod_icon"></span>'
			}

			let icon = TreeUtil.getProperty(node.getOptions(), "icon", "");
			if (icon !== "") {
				ret += '<div class="tj_icon">' + icon + '</div>';
			} else if ((icon = TreeUtil.getProperty(this.options, "parent_icon", "")) !== "") {
				ret += '<div class="tj_icon">' + icon + '</div>';
			} else {
				ret += '<div class="tj_icon">' + TreeConfig.parent_icon + '</div>';
			}

			span_desc.innerHTML = ret + node.toString() + '</span>';

			li_outer.appendChild(span_desc);

			if (node.isExpanded()) {
				const ul_container = document.createElement("ul");

				const ul_children = node.getChildren();

				for (let i = 0; i < ul_children.length; i ++) {
					ul_container.appendChild(this.renderNode(ul_children[i]));
				}

				li_outer.appendChild(ul_container)
			}
		}

		return li_outer;
	}
}

class TreeNode {
	/*
	* Constructor
	*/
	constructor(userObject, data, options) {
		
		this.children = [];
		this.events = [];

		this.expanded = true;
		this.enabled = true;
		this.selected = false;

		if (userObject) {
			if (typeof userObject !== "string" && typeof userObject.toString !== "function") {
				throw new Error("Parameter 1 must be of type String or Object, where it must have the function toString()");
			}
			this.userObject = userObject;
		} else {
			this.userObject = "";
		}

		if (data) {
			this.data = data;
		} else {
			this.data = {};
		}
	
		if (!options || typeof options !== "object") {
			this.options = {};
		} else {
			this.expanded = TreeUtil.getProperty(options, "expanded", true);
			this.enabled = TreeUtil.getProperty(options, "enabled", true);
			this.selected = TreeUtil.getProperty(options, "selected", false);
		}

	}

	/*
	* Methods
	*/
	addChild(node) {
		if (!TreeUtil.getProperty(this.options, "allowsChildren", true)) {
			console.warn("Option allowsChildren is set to false, no child added");
			return;
		}

		if (node instanceof TreeNode) {
			this.children.push(node);

			Object.defineProperty(node, "parent", {
				value: this,
				writable: false,
				enumerable: true,
				configurable: true
			});
		} else {
			throw new Error("Parameter 1 must be of type TreeNode");
		}
		return this;
	}

	removeAllChild() {
		if (this.children && this.children.length > 0) {
			for (let i = this.children.length - 1; i >= 0; i --) {
				this.removeChildPos(i);
			}
		}
		return this;
	}

	removeChildPos(pos) {
		if (typeof this.children[pos] !== "undefined") {
			if (typeof this.children[pos] !== "undefined") {
				this.children.splice(pos, 1);
			}
		}
		return this;
	}

	removeChild(node) {
		if (!(node instanceof TreeNode)) {
			throw new Error("Parameter 1 must be of type TreeNode");
		}

		this.removeChildPos(this.getIndexOfChild(node));
		return this;
	}

	getChildren() {
		return this.children;
	}

	getChildCount() {
		return this.children.length;
	}

	getIndexOfChild(node) {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].equals(node)) {
				return i;
			}
		}

		return -1;
	}

	getRoot() {
		let node = this;

		while (typeof node.parent !== "undefined") {
			node = node.parent;
		}

		return node;
	}

	setUserObject(_userObject) {
		if (!(typeof _userObject === "string") || typeof _userObject.toString !== "function") {
			throw new Error("Parameter 1 must be of type String or Object, where it must have the function toString()");
		} else {
			this.userObject = _userObject;
		}
		return this;
	}

	getUserObject() {
		return this.userObject;
	}

	setData(_data) {
		this.data = _data;
		return this;
	}

	getData() {
		return this.data;
	}

	setOptions(_options) {
		if (typeof _options === "object") {
			this.options = _options;
		}
		return this;
	}

	changeOption(option, value) {
		this.options[option] = value;
		return this;
	}

	getOptions() {
		return this.options;
	}

	isLeaf() {
		return (this.children.length === 0);
	}

	isDocument() {
		return (this.data.type === 'd');
	}

	setExpanded(_expanded) {
		if (this.isLeaf()) {
			return;
		}

		if (typeof _expanded === "boolean") {
			if (this.expanded === _expanded) {
				return;
			}

			this.expanded = _expanded;

			if (_expanded) {
				this.on("expand")(this);
			} else {
				this.on("collapse")(this);
			}

			this.on("toggle_expanded")(this);
		}
		return this;
	}

	toggleExpanded() {
		if (this.expanded) {
			this.setExpanded(false);
		} else {
			this.setExpanded(true);
		}
		return this;
	};

	isExpanded() {
		if (this.isLeaf()) {
			return true;
		} else {
			return this.expanded;
		}
	}

	setEnabled(_enabled) {
		if (typeof _enabled === "boolean") {
			if (this.enabled === _enabled) {
				return;
			}

			this.enabled = _enabled;

			if (_enabled) {
				this.on("enable")(this);
			} else {
				this.on("disable")(this);
			}

			this.on("toggle_enabled")(this);
		}
		return this;
	}

	toggleEnabled() {
		if (this.enabled) {
			this.setEnabled(false);
		} else {
			this.setEnabled(true);
		}
		return this;
	}

	isEnabled() {
		return this.enabled;
	}

	setSelected(_selected) {
		if (typeof _selected !== "boolean") {
			return;
		}

		if (this.selected === _selected) {
			return;
		}

		this.selected = _selected;

		if (_selected) {
			this.on("select")(this);
		} else {
			this.on("deselect")(this);
		}

		this.on("toggle_selected")(this);
		return this;
	}

	toggleSelected() {
		if (this.selected) {
			this.setSelected(false);
		} else {
			this.setSelected(true);
		}
		return this;
	}

	isSelected() {
		return this.selected;
	}

	open() {
		if (!this.isLeaf()) {
			this.on("open")(this);
		}
		return this;
	}

	on = function(ev, callback) {
		if (typeof callback === "undefined") {
			if (typeof this.events[ev] !== "function") {
				return function() {};
			} else {
				return this.events[ev];
			}
		}

		if (typeof callback !== 'function') {
			throw new Error("Argument 2 must be of type function");
		}

		this.events[ev] = callback;
	}

	getListener = function(ev) {
		return this.events[ev];
	}

	equals(node) {
		if (node instanceof TreeNode) {
			if (node.getUserObject() === this.userObject) {
				return true;
			}
		}

		return false;
	}

	toString() {
		if (typeof this.userObject === "string") {
			return this.userObject;
		} else {
			return this.userObject.toString();
		}
	}
}

class TreePath {
	constructor(root, node) {
		this.nodes = [];

		if (root instanceof TreeNode && node instanceof TreeNode) {
			this.setPath(root, node);
		}
	}

	setPath(root, node) {
		this.nodes = [];

		while(typeof node !== "undefined" && !node.equals(root)) {
			this.nodes.push(node);
			node = node.parent;
		}

		if (node.equals(root)) {
			this.nodes.push(root);
		} else {
			this.nodes = [];
			throw new Error("Node is not contained in the tree of root");
		}

		this.nodes = this.nodes.reverse();

		return this.nodes;
	}

	getPath() {
		return this.nodes;
	}

	toString() {
		return this.nodes.join(" - ");
	}

}

/*
* Util-Methods
*/
const TreeUtil = {
	default_leaf_icon: "<img src='assets/document.png'/>",
	default_parent_icon: "<img src='assets/openFolder.png'/>",
	default_open_icon: "<span>&#9698;</span>",
	default_close_icon: "<span>&#9654;</span>",

	isDOM: function(obj) {
		try {
			return obj instanceof HTMLElement;
		}
		catch(e) {
			return (typeof obj==="object") &&
			(obj.nodeType===1) && (typeof obj.style === "object") &&
			(typeof obj.ownerDocument ==="object");
		}
	},

	getProperty: function(options, opt, def) {
		if (typeof options[opt] === "undefined") {
			return def;
		}

		return options[opt];
	},

	expandNode: function(node) {
		node.setExpanded(true);

		if (!node.isLeaf()) {
			node.getChildren().forEach(function(child) {
				TreeUtil.expandNode(child);
			});
		}
	},

	collapseNode: function(node) {
		node.setExpanded(false);

		if (!node.isLeaf()) {
			node.getChildren().forEach(function(child) {
				TreeUtil.collapseNode(child);
			});
		}
	},

	getSelectedNodesForNode: function(node) {
		if (!(node instanceof TreeNode)) {
			throw new Error("Parameter 1 must be of type TreeNode");
		}

		let ret = [];

		if (node.isSelected()) {
			ret.push(node);
		}

		node.getChildren().forEach(function(child) {
			if (child.isSelected()) {
				if (ret.indexOf(child) === -1) {
					ret.push(child);
				}
			}

			if (!child.isLeaf()) {
				TreeUtil.getSelectedNodesForNode(child).forEach(function(_node) {
					if (ret.indexOf(_node) === -1) {
						ret.push(_node);
					}
				});
			}
		});

		return ret;
	}
};

const TreeConfig = {
	leaf_icon: TreeUtil.default_leaf_icon,
	parent_icon: TreeUtil.default_parent_icon,
	open_icon: TreeUtil.default_open_icon,
	close_icon: TreeUtil.default_close_icon,
	context_menu: undefined
};

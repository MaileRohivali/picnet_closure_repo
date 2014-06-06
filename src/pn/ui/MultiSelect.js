goog.provide('pn.ui.MultiSelect');
goog.provide('pn.ui.MultiSelectItem');

goog.require('pn.ui.BaseControl');


/**
 * @typedef {{id:string,name:string,cssclass:(string|undefined),
 *   selected:boolean, open:boolean, nodes:Array.<!pn.ui.MultiSelectItem>}}
 */
pn.ui.MultiSelectItem;



/**
 * A very simple/minimalist implementation of a multi select list using UL/LIs.
 *
 * @constructor
 * @extends {pn.ui.BaseControl}
 * @param {!Element} ul The parent element
 * @param {Array.<!pn.ui.MultiSelectItem>=} opt_children A list of
 *    name/id pair items.
 */
pn.ui.MultiSelect = function(ul, opt_children) {
  pn.assInst(ul, HTMLElement);

  pn.ui.BaseControl.call(this, ul);

  /** @type {boolean} Wether to allow allowMultiple selections */
  this.allowMultiple = true;

  /**
   * @type {boolean} Wether to treat selected items differently.
   *    Default to true and selected class added to selected items.
   */
  this.showSelection = true;

  /**
   * @type {string} The ID of the element that means 'All'. This item
   *    is handled separately as it clears others when selected.  And others
   *    clear this when selected.
   */
  this.allval = '';

  /** @private @const @type {!Element} */
  this.ul_ = ul;

  /** @private @type {!Element} */
  this.allli_;

  /**
   * @private
   * @type {function(!Array.<!pn.ui.MultiSelectItem>):undefined}
   *    On select callback
   */
  this.onselect_ = goog.nullFunction;

  /** @private @type {boolean} */
  this.readonly_ = !!ul.getAttribute('disabled');

  if (!this.readonly_) {
    ul.setAttribute('touch-action', '');
    var EventType = pn.ui.GlobalGestureHandler.EventType;
    this.ontap(this.ul_, this.selchanged_.pnbind(this));
    this.ongesture(EventType.HOLD, this.ul_, this.toggleopen_.pnbind(this));
  }

  /** @private @type {!Object.<pn.ui.MultiSelectItem>} */
  this.children_ = {};

  if (opt_children) this.options(opt_children);
};
goog.inherits(pn.ui.MultiSelect, pn.ui.BaseControl);


/** @param {!Array.<!pn.ui.MultiSelectItem>} list The list of children. */
pn.ui.MultiSelect.prototype.options = function(list) {
  this.children_ = {};
  var sb = new goog.string.StringBuffer();
  var doli = goog.bind(function(o, parentsb, forceopen) {
    this.children_[o.id] = o;

    var hasparent = !!parentsb;
    var listr = parentsb || new goog.string.StringBuffer();
    listr.append('<li data-itemid="', o.id,
        '" touch-action="" class="', o.cssclass || '');
    if (this.showSelection && o.selected) { listr.append(' selected'); }
    if (!!o.nodes) {
      var open = forceopen || o.open || o.nodes.pnfindIndex(
          function(n) { return n.selected || n.open; }) >= 0;
      listr.append(' branch', open ? ' open' : ' closed', '"');
      if (hasparent && !open) listr.append(' style="display:none"');
      listr.append('>', o.name, '</li>');
      o.nodes.pnforEach(function(n) { doli(n, listr, open); });
    } else {
      listr.append(' leaf"');
      if (hasparent && !o.open && !forceopen)
        listr.append(' style="display:none"');
      listr.append('>', o.name, '</li>');
    }
    return listr.toString();
  }, this);

  list.pnforEach(function(n) { sb.append(doli(n)); });
  this.ul_.innerHTML = sb.toString();

  if (!!this.allval)
    this.allli_ = pn.toarr(this.ul_.children).pnfind(function(li) {
      return li.getAttribute('data-itemid') === this.allval;
    }, this);
};


/**
 * @param {!Array.<!pn.ui.MultiSelectItem>} list The list of
 *    options to unselect.
 */
pn.ui.MultiSelect.prototype.unselect = function(list) {
  pn.toarr(goog.dom.getChildren(this.ul_)).pnforEach(function(li) {
    if (list.pnfindIndex(function(v) {
      return v.id.toString() === li.getAttribute('data-itemid');
    }) >= 0) {
      goog.dom.classes.remove(li, 'selected');
    }
  });
};


/**
 * @param {!Array.<!pn.ui.MultiSelectItem>} list The list of
 *    options to remove.
 */
pn.ui.MultiSelect.prototype.remove = function(list) {
  pn.toarr(goog.dom.getChildren(this.ul_)).pnforEach(function(li) {
    if (list.pnfindIndex(function(v) {
      return v.id.toString() === li.getAttribute('data-itemid');
    }) >= 0) {
      goog.dom.removeNode(li);
    }
  });
  list.pnforEach(function(item) {
    delete this.children_[item.id];
  }, this);
};


/**
 * @param {!(function(string):boolean|string)} filter The filter to apply
 *    on the list.
 */
pn.ui.MultiSelect.prototype.filter = function(filter) {
  var fun = goog.isFunction(filter) ?
      filter :
      this.defaultFilter_(filter);

  pn.toarr(this.ul_.children).
      pnforEach(function(el) { pn.dom.show(el, fun(el.innerHTML)); });
};


/** Clears the current filter */
pn.ui.MultiSelect.prototype.clearFilter = function() {
  pn.toarr(this.ul_.children).
      pnforEach(function(el) { pn.dom.show(el, true); });
};


/**
 * @private
 * @param {string} filter The filter string
 * @return {!function(string):boolean} A default filtering function.
 */
pn.ui.MultiSelect.prototype.defaultFilter_ = function(filter) {
  pn.assStr(filter);

  var exp = filter.toLowerCase();
  return function(val) { return val.toLowerCase().indexOf(exp) >= 0; };
};


/** @private @param {!goog.events.Event} e */
pn.ui.MultiSelect.prototype.toggleopen_ = function(e) {
  var li = /** @type {!Node} */ (e.target);
  if (!li || !li.getAttribute('data-itemid') ||
      !goog.dom.classes.has(li, 'branch')) return;
  goog.dom.classes.toggle(li, 'open');
  goog.dom.classes.toggle(li, 'closed');

  var opening = goog.dom.classes.has(li, 'open');
  this.show(this.getChildLis_(li), opening);
};


/** @private @param {!goog.events.Event} e */
pn.ui.MultiSelect.prototype.selchanged_ = function(e) {
  var li = /** @type {!Node} */ (e.target);
  if (!li || !li.getAttribute('data-itemid')) return;

  if (goog.dom.classes.has(li, 'branch')) {
    if (!this.allowMultiple) {
      // No multi select assume tap is same as hold
      this.toggleopen_(e);
    } else {
      var children = this.getChildLis_(li);
      var allselected = children.pnall(function(c) {
        return goog.dom.classes.has(c, 'selected');
      });
      this.setSelected_(children, !allselected);
      if (goog.dom.classes.has(li, 'closed')) { this.toggleopen_(e); }
    }
    return;
  }
  if (!this.allowMultiple) { this.clearSelected(true); }
  this.setSelected_([li], !goog.dom.classes.has(li, 'selected'));
};


/** @private @param {!Array.<!Element>} lis @param {boolean} selected */
pn.ui.MultiSelect.prototype.setSelected_ = function(lis, selected) {
  var ids = lis.pnmap(function(li) { return li.getAttribute('data-itemid'); }),
      allsel = selected && !!this.allval && ids.pncontains(this.allval),
      removeall = selected && !!this.allval && !ids.pncontains(this.allval);

  if (allsel) {
    pn.toarr(goog.dom.getChildren(this.ul_)).pnforEach(function(li) {
      goog.dom.classes.remove(li, 'selected');
    });
    goog.dom.classes.add(this.allli_, 'selected');
    return;
  }
  if (removeall) {
    goog.dom.classes.remove(this.allli_, 'selected');
  }

  lis.pnforEach(function(li) {
    if (selected) goog.dom.classes.add(li, 'selected');
    else goog.dom.classes.remove(li, 'selected');
  });
  this.onselect_(this.selected());
};


/** @private @param {!Node} from @return {!Array.<!Element>} selected */
pn.ui.MultiSelect.prototype.getChildLis_ = function(from) {
  var parent = from.parentNode,
      lis = pn.toarr(parent.children),
      start = lis.pnindexOf(from),
      end = lis.pnfindIndex(function(li2, idx) {
        return idx > start && goog.dom.classes.has(li2, 'branch');
      });
  if (end === -1) { end = lis.length; }
  return pn.range(start + 1, end - 1).pnmap(function(i) { return lis[i]; });
};


/**
 * Clears all selctions and fires changed event
 * @param {boolean=} opt_silent wether to notify listeners of change.
 */
pn.ui.MultiSelect.prototype.clearSelected = function(opt_silent) {
  var els = goog.dom.getElementsByTagNameAndClass('li', 'selected', this.ul_);
  if (pn.toarr(els).pnforEach(
      function(li) { goog.dom.classes.remove(li, 'selected'); }).length) {
    if (opt_silent !== true) this.onselect_(this.selected());
  }
};


/**
 * @param {function(!Array.<!pn.ui.MultiSelectItem>):undefined}
 *    handler The handler for select changes
 */
pn.ui.MultiSelect.prototype.onselectChanged = function(handler) {
  pn.assFun(handler);
  this.onselect_ = handler;
};


/** @return {!Array.<!pn.ui.MultiSelectItem>} The selected options */
pn.ui.MultiSelect.prototype.selected = function() {
  // Ensure no duplicate selections even if ID exists multiple times
  var selids = {},
      selected = pn.toarr(this.ul_.children).
          pnfilter(function(el) {
            if (goog.dom.classes.has(el, 'selected')) {
              var id = el.getAttribute('data-itemid');
              if (!selids[id]) {
                selids[id] = 1;
                return true;
              }
            }
            return false;
          }).
          pnmap(function(el) {
            // data-itemid is not a number parseInt get NaN
            var id = el.getAttribute('data-itemid');
            return this.children_[id];
          }, this);
  return selected;
};


/** @return {!Array.<!pn.ui.MultiSelectItem>} All options */
pn.ui.MultiSelect.prototype.all = function() {
  return goog.object.getValues(this.children_);
};


/** @override */
pn.ui.MultiSelect.prototype.disposeInternal = function() {
  pn.ui.MultiSelect.superClass_.disposeInternal.call(this);
  goog.dom.removeChildren(this.ul_);
  delete this.onselect_;
};

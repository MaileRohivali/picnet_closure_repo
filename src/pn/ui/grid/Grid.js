﻿;
goog.provide('pn.ui.grid.Grid');
goog.provide('pn.ui.grid.Grid.EventType');

goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.net.cookies');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('pn.data.EntityUtils');
goog.require('pn.ui.grid.Column');
goog.require('pn.ui.grid.Config');
goog.require('pn.ui.grid.QuickFilterHelpers');



/**
 * The pn.ui.grid.Grid is built atop SlickGrid
 * (https://github.com/mleibman/SlickGrid/).  See SlickGrid documentation for
 * full detauils.
 *
 * @constructor
 * @extends {goog.ui.Component}
 * @param {!pn.ui.UiSpec} spec The specs for the entities in
 *    this grid.
 * @param {!Array} list The entities to display.
 * @param {!Object.<Array>} cache The data cache to use for related entities.
 * @param {number} width The width of this grid.
 */
pn.ui.grid.Grid = function(spec, list, cache, width) {
  goog.asserts.assert(spec);
  goog.asserts.assert(list);
  goog.asserts.assert(cache);
  goog.asserts.assert(width > 0);

  goog.ui.Component.call(this);

  /**
   * @private
   * @type {!pn.ui.UiSpec}
   */
  this.spec_ = spec;

  var cols = this.spec_.getGridColumns();
  var uniqueColIds = goog.array.map(cols, function(c) {
    return c.id;
  });
  goog.array.removeDuplicates(uniqueColIds);
  goog.asserts.assert(cols.length === uniqueColIds.length,
      'All column IDs should be unique. Grid type: ' + this.spec_.id);

  /**
   * @private
   * @const
   * @type {string}
   */
  this.hash_ = /** @type {string} */ (goog.array.reduce(uniqueColIds,
      function(acc, f) { return acc + f; }, ''));

  /**
   * @private
   * @type {goog.debug.Logger}
   */
  this.log_ = pn.LogUtils.getLogger('pn.ui.grid.Grid');

  /**
   * @private
   * @type {!Array}
   */
  this.list_ = list;


  /**
   * @private
   * @type {!Array.<pn.ui.grid.Column>}
   */
  this.cols_ = this.getColumnsWithInitialState_(this.spec_.getGridColumns());

  /**
   * @private
   * @type {!pn.ui.grid.Config}
   */
  this.cfg_ = this.spec_.getGridConfig(width);

  /**
   * @private
   * @type {!Array.<pn.ui.grid.Column>}
   */
  this.totalColumns_ =
      goog.array.filter(this.cols_, function(c) { return c.total; });

  /**
   * @private
   * @type {!Object.<Array>}
   */
  this.cache_ = cache;

  /**
   * @private
   * @type {!Array.<pn.ui.grid.Command>}
   */
  this.commands_ = this.spec_.getGridCommands();

  /**
   * @private
   * @type {Slick.Grid}
   */
  this.slick_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.noData_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.gridContainer_ = null;

  /**
   * @private
   * @type {Slick.Data.DataView}
   */
  this.dataView_ = null;

  /**
   * @private
   * @type {Function}
   */
  this.selectionHandler_ = null;

  /**
   * @private
   * @type {!goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler(this);

  /**
   * @private
   * @type {null|function(Object):boolean}
   */
  this.currentFilter_ = null;

  /**
   * @private
   * @type {Object.<string>}
   */
  this.quickFilters_ = {};

  /**
   * @private
   * @type {Object}
   */
  this.sort_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.totalsLegend_ = null;
};
goog.inherits(pn.ui.grid.Grid, goog.ui.Component);


/**
 * @param {function(Object):boolean} filter The filter function to apply.
 */
pn.ui.grid.Grid.prototype.filter = function(filter) {
  this.log_.info('Filtering grid');
  this.currentFilter_ = filter;
  this.dataView_.refresh();
  this.slick_.render();
};


/**
 * @private
 * @param {!Object} item The row item to pass to the currentFilter_.
 * @return {boolean} Whether the specified item satisfies the currentFilter.
 */
pn.ui.grid.Grid.prototype.filterImpl_ = function(item) {
  if (this.cfg_.enableQuickFilters && !this.quickFilter_(item)) return false;
  return !this.currentFilter_ || this.currentFilter_(item);
};


/** @inheritDoc */
pn.ui.grid.Grid.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};


/** @inheritDoc */
pn.ui.grid.Grid.prototype.decorateInternal = function(element) {
  goog.asserts.assert(this.cfg_.width);

  this.setElementInternal(element);
  if (!this.cfg_.readonly) {
    goog.array.forEach(this.commands_, function(c) {
      c.decorate(element);
    }, this);
  }
  var height = 80 + Math.min(550, this.list_.length * 25) + 'px;';

  var parent = goog.dom.createDom('div', 'grid-parent ' + this.cfg_.type,
      this.noData_ = goog.dom.createDom('div', {
        'class': 'grid-no-data',
        'style': 'display:none'
      }, 'No matches found.'),
      this.gridContainer_ = goog.dom.createDom('div', {
        'class': 'grid-container',
        'style': 'width:' + this.cfg_.width + 'px;height:' + height
      })
      );
  goog.dom.appendChild(element, parent);

  this.dataView_ = new Slick.Data.DataView();
  this.slick_ = new Slick.Grid(this.gridContainer_, this.dataView_,
      goog.array.map(this.cols_, function(c) {
        return c.toSlick(!c.renderer ? null :
            goog.bind(function(row, cell, value, col, item) {
              return c.renderer(item, this.cache_, value, col);
            }, this));
      }, this), this.cfg_.toSlick());
  if (this.totalColumns_.length) {
    this.totalsLegend_ = goog.dom.createDom('div', 'totals-legend');
    goog.dom.appendChild(element, this.totalsLegend_);
  }
  goog.style.showElement(this.noData_, this.dataView_.getLength() === 0);
  goog.style.showElement(this.gridContainer_, true);
};


/**
 * @private
 * @param {!Array.<pn.ui.grid.Column>} cols The unsorted columns.
 * @return {!Array.<pn.ui.grid.Column>} The sorted columns with savewd widths.
 */
pn.ui.grid.Grid.prototype.getColumnsWithInitialState_ = function(cols) {
  var state = goog.net.cookies.get(this.hash_);
  if (!state) return cols;
  var data = goog.json.unsafeParse(state);
  var ids = data['ids'];
  var widths = data['widths'];
  var ordered = [];
  goog.array.forEach(ids, function(id, idx) {
    var colidx = goog.array.findIndex(cols, function(c) {
      return c.id === id;
    });
    var col = cols[colidx];
    delete cols[colidx];
    col.width = widths[idx];
    ordered.push(col);
  });
  // Add remaining columns (if any)
  goog.array.forEach(cols, ordered.push);
  return ordered;
};


/**
 * @return {Array.<Array.<string>>} The data of the grid. This is used when
 *    exporting the grid contents.
 */
pn.ui.grid.Grid.prototype.getGridData = function() {
  var headers = goog.array.map(this.cols_,
      function(c) { return c.name; }, this);
  var gridData = [headers];
  var lencol = this.cols_.length;

  for (var row = 0, len = this.list_.length; row < len; row++) {
    var rowData = this.list_[row];
    var rowTxt = [];

    for (var col = 0; col < lencol; col++) {
      var cc = this.cols_[col];
      var val = rowData[cc.dataProperty];
      var txt = cc.renderer ? cc.renderer(rowData, this.cache_, val, cc) : val;
      rowTxt.push(txt);
    }
    gridData.push(rowTxt);
  }
  return gridData;
};


/** @inheritDoc */
pn.ui.grid.Grid.prototype.enterDocument = function() {
  pn.ui.grid.Grid.superClass_.enterDocument.call(this);

  // Selecting
  if (!this.cfg_.readonly && this.commands_.length) {
    if (this.cfg_.allowEdit) {
      this.slick_.setSelectionModel(new Slick.RowSelectionModel());
      this.selectionHandler_ = goog.bind(this.handleSelection_, this);
      this.slick_.onSelectedRowsChanged.subscribe(this.selectionHandler_);
    }
    goog.array.forEach(this.commands_, function(c) {
      this.eh_.listen(c, c.eventType, function(e) { this.dispatchEvent(e); });
    }, this);
  }
  // Sorting
  this.slick_.onSort.subscribe(goog.bind(function(e, args) {
    this.sort_ = {
      'colid': args['sortCol']['id'],
      'asc': args['sortAsc']
    };
    this.dataView_.sort(function(a, b) {
      var x = a[args['sortCol']['field']],
          y = b[args['sortCol']['field']];
      return (x === y ? 0 : (x > y ? 1 : -1));
    }, args['sortAsc']);
    this.saveGridState_();
  }, this));
  this.dataView_.onRowsChanged.subscribe(goog.bind(function(e, args) {

    this.slick_.invalidateRows(args.rows);
    this.slick_.render();
  }, this));

  // Filtering
  this.dataView_.onRowCountChanged.subscribe(goog.bind(function() {
    this.slick_.updateRowCount();
    this.slick_.render();
    this.updateTotals_();
    goog.style.showElement(this.noData_, this.dataView_.getLength() === 0);
  }, this));


  // Initialise
  this.dataView_.beginUpdate();
  this.dataView_.setItems(this.list_, 'ID');
  this.dataView_.setFilter(goog.bind(this.filterImpl_, this));
  this.dataView_.endUpdate();

  // Quick Filters
  if (this.cfg_.enableQuickFilters) {
    var rfr = goog.bind(function() {
      this.resizeFiltersRow_();
      this.saveGridState_();
    }, this);
    this.slick_.onColumnsReordered.subscribe(rfr);
    this.slick_.onColumnsResized.subscribe(rfr);
    this.initFiltersRow_();
  }

  this.setGridInitialSortState_();
};


/** @private */
pn.ui.grid.Grid.prototype.setGridInitialSortState_ = function() {
  var state = goog.net.cookies.get(this.hash_);
  if (!state) return;
  var data = goog.json.unsafeParse(state);
  var col = null,
      asc = true;
  if (data['sort']) {
    col = data['sort']['colid'];
    asc = data['sort']['asc'];
  } else if (this.cfg_.defaultSortColumn) {
    col = this.cfg_.defaultSortColumn;
    col = this.cfg_.defaultSortAscending;
  }
  if (col) {
    this.dataView_.fastSort(col, asc);
    this.slick_.setSortColumn(col, asc);
  }
};


/** @private */
pn.ui.grid.Grid.prototype.updateTotals_ = function() {
  if (!this.totalColumns_.length) return;
  var items = this.dataView_.getItems();
  var total = goog.array.reduce(items,
      function(acc, item) {
        goog.array.forEach(this.totalColumns_, function(c) {
          if (acc[c.id] === undefined) acc[c.id] = 0;
          var itemVal = item[c.id];
          if (itemVal) acc[c.id] += itemVal;
        }, this);
        return acc;
      }, {}, this);
  var html = [];
  for (var field in total) {
    var col = goog.array.find(this.totalColumns_, function(c) {
      return c.id === field;
    });
    var val = total[field];
    if (col.renderer) { val = col.renderer({}, this.cache_, val, col); }
    else { val = parseInt(val, 10); }
    html.push('Total ' + col.name + ': ' + val || '0');
  }
  this.totalsLegend_.innerHTML = '<ul><li>' +
      html.join('</li><li>') + '</li>';
};


/** @inheritDoc */
pn.ui.grid.Grid.prototype.exitDocument = function() {
  pn.ui.grid.Grid.superClass_.exitDocument.call(this);
  this.eh_.removeAll();
};


/** @private */
pn.ui.grid.Grid.prototype.initFiltersRow_ = function() {
  for (var i = 0; i < this.cols_.length; i++) {
    var col = this.cols_[i];
    var header = this.slick_.getHeaderRowColumn(col.id);
    var val = this.quickFilters_[col.id];
    var input = pn.ui.grid.QuickFilterHelpers.
        createFilterInput(col, 100, val);
    input['data-id'] = col.id;

    goog.dom.removeChildren(header);
    goog.dom.appendChild(header, input);
  }

  var dv = this.dataView_;
  var qf = this.quickFilters_;

  $(this.slick_.getHeaderRow()).delegate(':input', 'change keyup',
      function() {
        qf[this['data-id']] = $.trim(
            /** @type {string} */ ($(this).val())).toLowerCase();
        dv.refresh();
      });

  this.resizeFiltersRow_();
};


/** @private */
pn.ui.grid.Grid.prototype.saveGridState_ = function() {
  var columns = this.slick_.getColumns();
  var data = {
    'ids': goog.array.map(columns, function(c) { return c.id; }),
    'widths': goog.array.map(columns, function(c) { return c.width; }),
    'sort': this.sort_
  };
  goog.net.cookies.set(this.hash_, goog.json.serialize(data));
};


/** @private */
pn.ui.grid.Grid.prototype.resizeFiltersRow_ = function() {
  var grid = /** @type {Element} */
      (this.slick_.getHeaderRow().parentNode.parentNode);
  var headerTemplates =
      goog.dom.getElementsByClass('slick-header-column', grid);
  for (var i = 0; i < this.cols_.length; i++) {
    var col = this.cols_[i];
    var header = this.slick_.getHeaderRowColumn(col.id);

    var input = goog.dom.getChildren(header)[0];
    var width = jQuery(headerTemplates[i]).width();
    goog.style.setWidth(header, width - 1);
    goog.style.setWidth(input, width - 3);

  }
};


/**
 * @private
 * @param {!Object} entity the row data item.
 * @return {boolean} Wether the item meets the quick filters.
 */
pn.ui.grid.Grid.prototype.quickFilter_ = function(entity) {
  goog.asserts.assert(entity);

  for (var columnId in this.quickFilters_) {
    if (columnId && this.quickFilters_[columnId]) {
      var filterVal = this.quickFilters_[columnId];
      var col = /** @type {pn.ui.grid.Column} */
          (goog.array.find(this.cols_,
              function(col) { return col.id === columnId; }));
      var val = entity[col.dataProperty];
      if (col.renderer === pn.ui.grid.ColumnRenderers.parentColumnRenderer) {
        val = val ? pn.data.EntityUtils.
            getEntityDisplayValue(this.cache_, col.displayPath, val) :
            '';
      } else if (col.renderer) {
        val = col.renderer(entity, this.cache_, val, col);
      }
      if (goog.isDefAndNotNull(val)) { val = val.toString().toLowerCase(); }
      if (!goog.isDefAndNotNull(val) || val.indexOf(filterVal) < 0) {
        return false;
      }
    }
  }
  return true;
};


/**
 * @private
 * @param {Event} ev The selection event from the SlickGrid.
 * @param {Object} evData The data for the selection event.
 */
pn.ui.grid.Grid.prototype.handleSelection_ = function(ev, evData) {
  var idx = evData['rows'][0];
  var selected = this.dataView_.getItem(idx);
  var e = new goog.events.Event(pn.ui.grid.Grid.EventType.ROW_SELECTED, this);
  e.selected = selected;
  this.dispatchEvent(e);
};


/** @inheritDoc */
pn.ui.grid.Grid.prototype.disposeInternal = function() {
  pn.ui.grid.Grid.superClass_.disposeInternal.call(this);

  goog.array.forEach(this.commands_, goog.dispose);
  goog.array.forEach(this.cols_, goog.dispose);
  goog.object.forEach(this.quickFilters_, goog.dispose);
  goog.dispose(this.cfg_);
  if (this.slick_) this.slick_.destroy();
  goog.dispose(this.slick_);
  goog.dispose(this.dataView_);
  this.eh_.removeAll();
  goog.dispose(this.eh_);
  goog.dispose(this.log_);
  goog.dispose(this.noData_);
  goog.dispose(this.gridContainer_);
  if (this.totalsLegend_) goog.dispose(this.totalsLegend_);
  goog.dispose(this.spec_);

  delete this.spec_;
  delete this.quickFilters_;
  delete this.eh_;
  delete this.slick_;
  delete this.dataView_;
  delete this.cfg_;
  delete this.log_;
  delete this.totalsLegend_;
  delete this.list_;
  delete this.cols_;
  delete this.totalColumns_;
  delete this.cfg_;
  delete this.cache_;
  delete this.commands_;
  delete this.slick_;
  delete this.noData_;
  delete this.gridContainer_;
  delete this.selectionHandler_;
  delete this.currentFilter_;
  delete this.sort_;
};


/**
 * @enum {string}
 */
pn.ui.grid.Grid.EventType = {
  ROW_SELECTED: 'row-selected',
  ADD: 'add',
  EXPORT_DATA: 'export-data'
};

'use babel';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      //'adam-debug:toggle': () => this.toggle(),
      'adam-debug:insertTracing': () => this.insertTracing(),
      'adam-debug:removeTracing': () => this.removeTracing(),
    }));

    this.functionList = null;

    this.debugText = "\t\t\tDebug.log('{class}::{function}'); //autoInsert\n";
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {  },

  _getRangesForRegex(editor, regex) {
    let buffer = editor.getBuffer();
    let lastRow = buffer.getLastRow();
    let ranges = [ ];
    for (let i = 0; i < lastRow; i++) {
      let r = buffer.rangeForRow(i, true);
      let text = buffer.getTextInRange(r);
      if (text.match(regex)) {
        ranges.unshift([r, text]);
      }
    }
    return(ranges);
  },
  _getFunctionRanges(editor) {
    let regex = /(?:override)* (public|protected) function /;
    let rawRanges = this._getRangesForRegex(editor, regex);
    let funcRanges = [ ];
    for (r of rawRanges) {
      let range = r[0];
      let text = r[1];
      let parts = text.split(regex);
      let insertLine = false;
      parts = parts.slice(2);
      let fname = parts[0].substring(0, parts[0].indexOf('('));
      fname = fname == this._getClass(editor) ? 'constructor' : fname;
      if (text.indexOf('return') >= 0) {
        range.end.row = range.start.row;
        range.end.column = text.indexOf('return');
        insertLine = true;
      }
      funcRanges.push([range, fname, insertLine]);
    }
    return(funcRanges);
  },

  _getDebugRanges(editor) {
    let regex = /Debug\.log\(.* \/\/autoInsert/;
    let rawRanges = this._getRangesForRegex(editor, regex);
    return(rawRanges);
  },

  _getClass(editor) {
    return(editor.getTitle().replace('.as', ''));
  },

  toggle() {
    //this.insertTracing();
    // this.removeTracing();
  },

  insertTracing() {
    let editor = atom.workspace.getActiveTextEditor();
    let logText = this.debugText.replace('{class}', this._getClass(editor));
    let ranges = this._getFunctionRanges(editor);
    let buffer = editor.getBuffer();
    for (range of ranges) {
      let r = range[0];
      let funcName = range[1];
      let insertLine = range[2];
      let text = logText.replace('{function}', funcName);
      if (insertLine) {
        text = '\n' + text + '\t\t\t';
      }
      buffer.insert(r.end, text);
    }
  },

  removeTracing() {
    let editor = atom.workspace.getActiveTextEditor();
    let ranges = this._getDebugRanges(editor);
    let buffer = editor.getBuffer();
    for (range of ranges) {
      buffer.delete(range[0]);
      let newTextAtRange = buffer.getTextInRange(range[0])
      console.log(newTextAtRange);
    }
  }

};

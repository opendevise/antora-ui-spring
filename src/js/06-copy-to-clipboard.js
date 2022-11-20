;(function () {
  'use strict'

  var CMD_RX = /^\$ (\S[^\\\n]*(\\\n(?!\$ )[^\\\n]*)*)(?=\n|$)/gm
  var LINE_CONTINUATION_RX = /( ) *\\\n *|\\\n( ?) */g
  var TRAILING_SPACE_RX = / +$/gm

  var config = (document.getElementById('site-script') || { dataset: {} }).dataset
  var uiRootPath = config.uiRootPath == null ? '.' : config.uiRootPath
  var supportsCopy = window.navigator.clipboard

  ;[].slice.call(document.querySelectorAll('.doc pre.highlight, .doc .literalblock pre')).forEach(function (pre) {
    var code, copy, fold, img, toast, toolbox
    if (pre.classList.contains('highlight')) {
      code = pre.querySelector('code')
    } else if (pre.innerText.startsWith('$ ')) {
      var block = pre.parentNode.parentNode
      block.classList.remove('literalblock')
      block.classList.add('listingblock')
      pre.classList.add('highlightjs', 'highlight')
      ;(code = document.createElement('code')).className = 'language-console hljs'
      code.dataset.lang = 'console'
      code.appendChild(pre.firstChild)
      pre.appendChild(code)
    } else {
      return
    }
    ;(toolbox = document.createElement('div')).className = 'source-toolbox'
    if (pre.querySelector('span.fold-block')) {
      ;(fold = document.createElement('button')).className = 'fold-button'
      fold.setAttribute('title', (fold.dataset.foldedTitle = 'Expand foldable text'))
      fold.dataset.unfoldedTitle = 'Collapse foldable text'
      img = document.createElement('img')
      img.src = uiRootPath + '/img/octicons-16.svg#view-unfold'
      img.alt = 'unfold icon'
      img.className = 'unfold-icon'
      fold.appendChild(img)
      img = document.createElement('img')
      img.src = uiRootPath + '/img/octicons-16.svg#view-fold'
      img.alt = 'fold icon'
      img.className = 'fold-icon'
      fold.appendChild(img)
      toolbox.appendChild(fold)
    }
    if (supportsCopy) {
      ;(copy = document.createElement('button')).className = 'copy-button'
      copy.setAttribute('title', 'Copy to clipboard')
      img = document.createElement('img')
      img.src = uiRootPath + '/img/octicons-16.svg#view-clippy'
      img.alt = 'copy icon'
      img.className = 'copy-icon'
      copy.appendChild(img)
      ;(toast = document.createElement('span')).className = 'copy-toast'
      toast.appendChild(document.createTextNode('Copied!'))
      copy.appendChild(toast)
      toolbox.appendChild(copy)
    }
    pre.appendChild(toolbox)
    if (fold) fold.addEventListener('click', toggleFolds.bind(fold, code))
    if (copy) copy.addEventListener('click', writeToClipboard.bind(copy, code))
  })

  function extractCommands (text) {
    var cmds = []
    var match
    while ((match = CMD_RX.exec(text))) cmds.push(match[1].replace(LINE_CONTINUATION_RX, '$1$2'))
    return cmds.join(' && ')
  }

  function toggleFolds (code) {
    var scratcBlock = getScratchBlock(code)
    var newState = code.classList.contains('unfolded') ? 'folded' : 'unfolded'
    ;[].slice.call(code.querySelectorAll('.fold-block')).forEach(function (foldBlock) {
      if (foldBlock.classList.length === 1) return
      foldBlock.removeEventListener('transitionrun', clearMaxHeight)
      foldBlock.removeEventListener('transitionend', clearMaxHeight)
      if (foldBlock.classList.contains('hide-when-' + newState)) {
        foldBlock.style.maxHeight = Math.round(foldBlock.getBoundingClientRect().height) + 'px'
        //foldBlock.style.maxHeight = foldBlock.offsetHeight + 'px' // use if style needs to be flushed
        foldBlock.addEventListener('transitionrun', clearMaxHeight)
      } else {
        var foldBlockClone = scratchBlock.appendChild(foldBlock.cloneNode(true))
        foldBlock.style.maxHeight = Math.round(foldBlockClone.getBoundingClientRect().height) + 'px'
        //foldBlock.style.maxHeight = foldBlockClone.offsetHeight + 'px' // use if style needs to be flushed
        foldBlock.addEventListener('transitionend', clearMaxHeight)
      }
    })
    scratchBlock.innerHTML = ''
    this.setAttribute('title', this.dataset[newState + 'Title'])
    code.classList[newState === 'unfolded' ? 'add' : 'remove']('unfolded')
  }

  function clearMaxHeight (e) {
    this.removeEventListener(e.type, clearMaxHeight)
    this.style.maxHeight = ''
  }

  function getScratchBlock (code) {
    return code.querySelector('.scratch-block') ||
      code.appendChild(Object.assign(document.createElement('div'), {
        className: 'scratch-block',
        style: 'clear: left; height: 0; overflow: hidden',
      }))
  }

  function writeToClipboard (code) {
    var codeClone = code.cloneNode(true)
    // TODO verify calling querySelectorAll on a clone not in document works across browsers
    ;[].slice.call(codeClone.querySelectorAll('.hide-when-unfolded')).forEach(function (el) {
      el.parentNode.removeChild(el)
    })
    var text = codeClone.innerText.replace(TRAILING_SPACE_RX, '')
    if (code.dataset.lang === 'console' && text.startsWith('$ ')) text = extractCommands(text)
    window.navigator.clipboard.writeText(text).then(
      function () {
        this.classList.add('clicked')
        this.offsetHeight // eslint-disable-line no-unused-expressions
        this.classList.remove('clicked')
      }.bind(this),
      function () {}
    )
  }
})()

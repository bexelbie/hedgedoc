'use strict'

/**
 * Escape a string for safe use inside an HTML attribute.
 * @param {string} str
 * @returns {string}
 */
function escapeAttr (str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Inline rule that matches CriticMarkup comment syntax: {>> comment text <<}
 * @param {import('markdown-it/lib/rules_inline/state_inline')} state
 * @param {boolean} silent
 * @returns {boolean}
 */
function criticCommentRule (state, silent) {
  var start = state.pos

  // Quick check: must start with '{'
  if (state.src.charCodeAt(start) !== 0x7B /* { */) return false

  // Check for opening marker '{>>'
  if (state.src.slice(start, start + 3) !== '{>>') return false

  // Search for closing marker '<<}'
  var closeIdx = state.src.indexOf('<<}', start + 3)
  if (closeIdx === -1) return false

  // Validation pass — just confirm the match exists
  if (silent) return true

  // Extract and trim comment text
  var content = state.src.slice(start + 3, closeIdx).trim()

  // Create token
  var token = state.push('critic_comment', '', 0)
  token.content = content

  // Advance past the closing '<<}'
  state.pos = closeIdx + 3

  return true
}

/**
 * markdown-it plugin that converts CriticMarkup comment syntax
 * `{>> comment text <<}` into an inline comment icon with a data attribute.
 *
 * @param {import('markdown-it')} md
 */
module.exports = function criticCommentPlugin (md) {
  md.inline.ruler.push('critic_comment', criticCommentRule)

  md.renderer.rules.critic_comment = function (tokens, idx) {
    var content = escapeAttr(tokens[idx].content)
    return '<span class="critic-comment" data-comment="' + content + '"><i class="fa fa-comment"></i></span>'
  }
}

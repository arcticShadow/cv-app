import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from '../../js/md-parser.js';

describe('md-parser', () => {
  describe('frontmatter', () => {
    it('extracts YAML frontmatter', () => {
      const input = `---
title: Test
company: Acme
---
# Hello`;
      const result = parseMarkdown(input);
      assert.deepStrictEqual(result.frontmatter, { title: 'Test', company: 'Acme' });
    });

    it('returns empty object when no frontmatter', () => {
      const result = parseMarkdown('# Hello');
      assert.deepStrictEqual(result.frontmatter, {});
    });

    it('handles empty frontmatter delimiters', () => {
      const input = `---\n---\n# Hello`;
      const result = parseMarkdown(input);
      assert.deepStrictEqual(result.frontmatter, {});
    });
  });

  describe('headings', () => {
    it('renders h1', () => {
      const result = parseMarkdown('# Title');
      assert.match(result.html, /<h1[^>]*>Title<\/h1>/);
    });

    it('renders h2', () => {
      const result = parseMarkdown('## Subtitle');
      assert.match(result.html, /<h2[^>]*>Subtitle<\/h2>/);
    });

    it('renders h3', () => {
      const result = parseMarkdown('### Section');
      assert.match(result.html, /<h3[^>]*>Section<\/h3>/);
    });

    it('renders h4 through h6', () => {
      const result = parseMarkdown('#### A\n\n##### B\n\n###### C');
      assert.match(result.html, /<h4[^>]*>A<\/h4>/);
      assert.match(result.html, /<h5[^>]*>B<\/h5>/);
      assert.match(result.html, /<h6[^>]*>C<\/h6>/);
    });
  });

  describe('inline formatting', () => {
    it('renders bold with double asterisks', () => {
      const result = parseMarkdown('**bold**');
      assert.match(result.html, /<strong>bold<\/strong>/);
    });

    it('renders italic with single asterisk', () => {
      const result = parseMarkdown('*italic*');
      assert.match(result.html, /<em>italic<\/em>/);
    });

    it('renders inline code with backticks', () => {
      const result = parseMarkdown('`code`');
      assert.match(result.html, /<code>code<\/code>/);
    });

    it('renders links', () => {
      const result = parseMarkdown('[text](https://example.com)');
      assert.match(result.html, /<a href="https:\/\/example\.com"[^>]*>text<\/a>/);
    });
  });

  describe('paragraphs', () => {
    it('wraps bare text in paragraphs', () => {
      const result = parseMarkdown('Hello world');
      assert.match(result.html, /<p>Hello world<\/p>/);
    });

    it('separates paragraphs with blank lines', () => {
      const result = parseMarkdown('Para one.\n\nPara two.');
      assert.match(result.html, /<p>Para one\.<\/p>/);
      assert.match(result.html, /<p>Para two\.<\/p>/);
    });
  });
});

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"regexp"
	"strconv"
	"time"
)

type LogLine struct {
	Hostname string
	Time     time.Time
	Method   string
	Path     string
	Status   int
	Size     int
	Referer  string
	UA       string
}

var reLine = regexp.MustCompile(`^(\S+) - - \[(.*?) \+0000\] "(\S+) (.*?) HTTP/1.1" (\S+) (\S+) "(.*?)" "(.*?)"`)

func (l *LogLine) parse(text string) error {
	m := reLine.FindStringSubmatch(text)
	if m == nil {
		return fmt.Errorf("failed to match")
	}
	var timeStr string
	var status string
	var size string
	var ua string
	l.Hostname, timeStr, l.Method, l.Path, status, size, l.Referer, ua = m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]

	var err error
	l.Time, err = time.Parse("02/Jan/2006:15:04:05", timeStr)
	if err != nil {
		return err
	}

	n, err := strconv.ParseInt(status, 10, 32)
	if err != nil {
		return err
	}
	l.Status = int(n)

	if size == "-" {
		l.Size = -1
	} else {
		n, err := strconv.ParseInt(size, 10, 32)
		if err != nil {
			return err
		}
		l.Size = int(n)
	}

	if ua == "-" {
		ua = ""
	}
	l.UA = ua

	return nil
}

// logMinHeap is a minheap that lets us find the earliest LogLine from a set quickly.
type logMinHeap struct {
	lines []*LogLine
	cap   int
	size  int
}

func newLogMinHeap(cap int) *logMinHeap {
	return &logMinHeap{
		lines: make([]*LogLine, cap),
		cap:   cap,
	}
}

func (h *logMinHeap) insert(line *LogLine) {
	h.lines[h.size] = line
	i := h.size
	for i != 0 {
		parent := (i - 1) / 2
		if h.lines[i].Time.After(h.lines[parent].Time) {
			break
		}
		h.lines[parent], h.lines[i] = h.lines[i], h.lines[parent]
		i = parent
	}
	h.size++
}

func (h *logMinHeap) pop() *LogLine {
	ret := h.lines[0]
	h.lines[0] = h.lines[h.size-1]
	h.size--

	i := 0
	for {
		smallest := i
		left := i*2 + 1
		right := i*2 + 2
		if left < h.size && h.lines[left].Time.Before(h.lines[smallest].Time) {
			smallest = left
		}
		if right < h.size && h.lines[right].Time.Before(h.lines[smallest].Time) {
			smallest = right
		}
		if smallest == i {
			break
		}
		h.lines[i], h.lines[smallest] = h.lines[smallest], h.lines[i]
		i = smallest
	}

	return ret
}

type Loader struct {
	metaWriter io.WriteCloser
	timeWriter *NumColWriter
	pathWriter *StrColWriter
	refWriter  *StrColWriter
	uaWriter   *StrColWriter
}

func newLoader(dir string) (*Loader, error) {
	var l Loader

	f, err := os.Create(path.Join(dir, "meta"))
	if err != nil {
		return nil, err
	}
	l.metaWriter = f

	t, err := NewColumnWriter(path.Join(dir, "time.js"))
	if err != nil {
		return nil, err
	}
	l.timeWriter = NewNumColWriter(t)
	l.timeWriter.Ascending = true

	t, err = NewColumnWriter(path.Join(dir, "path.js"))
	if err != nil {
		return nil, err
	}
	l.pathWriter = NewStrColWriter(t)

	t, err = NewColumnWriter(path.Join(dir, "ref.js"))
	if err != nil {
		return nil, err
	}
	l.refWriter = NewStrColWriter(t)

	t, err = NewColumnWriter(path.Join(dir, "ua.js"))
	if err != nil {
		return nil, err
	}
	l.uaWriter = NewStrColWriter(t)

	return &l, nil
}

func (l *Loader) writeLine(logLine *LogLine) error {
	if err := l.timeWriter.Write(int(logLine.Time.Unix())); err != nil {
		return err
	}
	if err := l.pathWriter.Write(logLine.Path); err != nil {
		return err
	}
	referer := logLine.Referer
	if referer == "-" {
		referer = ""
	}
	if err := l.refWriter.Write(referer); err != nil {
		return err
	}
	if err := l.uaWriter.Write(logLine.UA); err != nil {
		return err
	}
	return nil
}

func (l *Loader) parse(r io.Reader) error {
	rows := 0
	lines := 0
	s := bufio.NewScanner(r)

	// Use a minheap to handle the case of log lines being slightly out of order.
	heap := newLogMinHeap(32)
	for s.Scan() {
		var logLine *LogLine
		if heap.cap == heap.size {
			logLine = heap.pop()
			if err := l.writeLine(logLine); err != nil {
				return fmt.Errorf("line %d: %s in %q", lines, err, logLine)
			}
			rows++
		} else {
			logLine = &LogLine{}
		}

		lines++
		line := s.Text()
		if err := logLine.parse(line); err != nil {
			return fmt.Errorf("line %d: %s in %q", lines, err, line)
		}
		if logLine.Status != 200 {
			continue
		}
		heap.insert(logLine)
	}
	if err := s.Err(); err != nil {
		return err
	}

	for heap.size > 0 {
		logLine := heap.pop()
		if err := l.writeLine(logLine); err != nil {
			return fmt.Errorf("line %d: %s in %q", lines, err, logLine)
		}
		rows++
	}

	log.Printf("read %d lines", rows)

	type Column interface {
		Finish() error
		Flush() error
		Close() error
	}

	for _, w := range []Column{l.timeWriter, l.pathWriter, l.refWriter, l.uaWriter} {
		if err := w.Finish(); err != nil {
			return err
		}
		if err := w.Flush(); err != nil {
			return err
		}
		if err := w.Close(); err != nil {
			return err
		}
	}

	type ColMeta map[string]interface{}
	type Meta struct {
		Rows int                `json:"rows"`
		Cols map[string]ColMeta `json:"cols"`
	}

	meta := Meta{Rows: rows, Cols: map[string]ColMeta{}}
	meta.Cols["time"] = ColMeta{"type": "num", "asc": true}
	meta.Cols["path"] = ColMeta{"type": "str"}
	meta.Cols["ref"] = ColMeta{"type": "str"}
	meta.Cols["ua"] = ColMeta{"type": "str"}
	if err := json.NewEncoder(l.metaWriter).Encode(meta); err != nil {
		return err
	}
	if err := l.metaWriter.Close(); err != nil {
		return err
	}

	return nil
}

func run(args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("usage: ingest outpath")
	}
	outpath := args[0]

	l, err := newLoader(outpath)
	if err != nil {
		return err
	}

	return l.parse(os.Stdin)
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Printf("ERROR: %s\n", err)
	}
}

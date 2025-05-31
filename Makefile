# cSpell:ignore htmltest refcache

HTMLTEST_DIR=tmp
HTMLTEST?=htmltest # Specify as make arg if different
HTMLTEST_ARGS?=--log-level 1
REFCACHE_FILE?=refcache.json
REFCACHE_DEST?=static
REFCACHE_SRC?=$(HTMLTEST_DIR)/.htmltest

# Use $(HTMLTEST) in PATH, if available; otherwise, we'll get a copy
ifeq (, $(shell which $(HTMLTEST)))
override HTMLTEST=$(HTMLTEST_DIR)/bin/htmltest
ifeq (, $(shell which $(HTMLTEST)))
GET_LINK_CHECKER_IF_NEEDED=get-link-checker
endif
endif

default:
	@echo "Make what? Target list:\n"
	@make -rpn | grep '^[a-z]\S*:' | sed 's/://' | sort

$(REFCACHE_SRC):
	mkdir -p $(REFCACHE_SRC)

$(REFCACHE_DEST)/$(REFCACHE_FILE):
	mkdir -p $(REFCACHE_DEST)
	echo '{}' > $(REFCACHE_DEST)/$(REFCACHE_FILE)

refcache-restore: $(REFCACHE_DEST)/$(REFCACHE_FILE) $(REFCACHE_SRC)
	cp $(REFCACHE_DEST)/$(REFCACHE_FILE) $(REFCACHE_SRC)/

refcache-save:
	cp $(REFCACHE_SRC)/$(REFCACHE_FILE) $(REFCACHE_DEST)/
	npx prettier --prose-wrap=always --write $(REFCACHE_DEST)/$(REFCACHE_FILE)

check-links: $(GET_LINK_CHECKER_IF_NEEDED) \
	refcache-restore check-links-only refcache-save

check-links-only:
	$(HTMLTEST) $(HTMLTEST_ARGS)

clean:
	rm -rf $(HTMLTEST_DIR) public/* resources

get-link-checker:
	rm -Rf $(HTMLTEST_DIR)/bin
	curl https://htmltest.wjdp.uk | bash -s -- -b $(HTMLTEST_DIR)/bin

# This file is part of XMPP Pane.
#
# Copyright ⓒ 2017 Adrien Dorsaz <adrien@adorsaz.ch>
#
# XMPP Pane is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# XMPP Pane is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with XMPP Pane. If not, see <http://www.gnu.org/licenses/>.

.PHONY: build-dev build-zip beautifyjs


buid-zip:
	# Sync all files except 3rdparty and git directory
	zip ../xmpp-pane.zip -FS -R '*' \
		-x 'src/3rdparty/*' '.git/*'
	# For 3rdparty, uses a limited list of files to include
	zip ../xmpp-pane.zip 'src/3rdparty/mustache.js/mustache.js'

build-dev: beautify-js build-zip

beautify-js:
	find -path './src/3rdparty' -prune \
		-o -path './.git/*' -prune \
		-o \( -name "*.js" -o -name "*.json" \) \
		-exec js-beautify --indent-size=4 --indent-char=' ' --jslint-happy \
			--operator-position after-newline --brace-style end-expand --replace \
			--end-with-newline \
		{} \;

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

build: beautify-js
	zip ../xmpp-pane.zip -FS -r *

beautify-js:
	find \( -name "*.js" -o -name "*.json" \) -exec \
		js-beautify --indent-size=4 --indent-char=' ' --jslint-happy \
		--operator-position after-newline --brace-style end-expand --replace \
		--end-with-newline \
		{} \;

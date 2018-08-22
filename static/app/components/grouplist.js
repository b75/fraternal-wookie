"use strict";

(function() {

	// BEGIN TEMPLATE
	const tpl = `
<div class="component-root">
	<h4 class="ui top attached header"><i class="users icon"></i> My groups</h4>
	<div class="ui attached segment">
		<div class="ui relaxed animated list">
			<template v-if="groups.length">
				<a v-on:click.prevent="$emit('select-group', group)" v-for="group in groups" v-bind:class="{ item: true, blue: group.Id === selectedId }">
					<i v-bind:class="[ group.Id === selectedId ? 'users' : 'user', 'middle', 'aligned', 'icon' ]"></i>
					<div class="content">
						<div class="header">{{ group.Name }}</div>
						<div class="description">{{ group.Description }}</div>
					</div>
				</a>
			</template>
			<template v-else>
				<div class="item">
					<div class="content">
						<div class="header">No groups</div>
						<div class="blue description">There are currently no groups to show...</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</div>
	`;
	// END TEMPLATE

	Vue.component("app-group-list", {
		template: tpl,
		props: ["groups", "selected"],
		computed: {
			selectedId: function() {
				if (!this.selected) {
					return null;
				}
				return this.selected.Id;
			}
		}
	});
}());

"use strict";

(function() {

	// BEGIN TEMPLATE
	const tpl = `
<div class="ui raised olive segment">
	<template v-if="group">
		<h3 class="ui header"><i class="users icon"></i> {{ group.Name }}</h3>
		<p>{{ group.Description }}</p>
	</template>
	<template v-else>
		<p><i>No selected group</i></p>
	</template>
</div>
	`;
	// END TEMPLATE

	Vue.component("app-group-detail", {
		template: tpl,
		props: ["group"],
		watch: {
			group: function(newGroup, oldGroup) {
				alert("TODO");
			}
		}
	});
}());

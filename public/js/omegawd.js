var Article = {
	content: {title:"",subTitle:"",text:"",blurb:""},
	meta: {},
	media: []
}

$(document).ready(function(){
var classes = ['content', 'meta', 'media'];
  $('#MyForm').transloadit({
      wait: false,
      fields: true
  });
  $('.picker').live('click', function (e){
    var select = $(this).attr('data-filter');
    _.each(classes, function(index){if(index != select)$('.'+index).hide()});
    $('.'+select).toggle();})
  $('.subMenuItem').live('click', function(e){
	 var select = $(this).attr('data-filter');
	$('.'+select).toggle();})
	function updoc(_id, field, key, valu){
		var data = {"_id":_id, "field":field, "key":key,"valu":valu};
		$.post('/update?_id='+_id+'&field='+field+'&key='+key+'&valu='+valu, function(){console.log('sucksess')}).error(function(){console.log('err')})};
	function bindAndReplace (elem){
		elem.live('change',function(e){
			var a = $(this).attr('data-class');
			var b = $(this).attr('id');
			var c = $(this).val();
			function update (a,b,c){
				Article[a][b] = c;
			}
			update(a,b,c);
			bindAndReplace($(this));
			console.log(Article);
			updoc($('#document').attr('data-filter'), a, b, c)
		});
	}bindAndReplace($('textarea'))
});
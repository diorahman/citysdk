
  // var propertyTypes = {
  //   "Quantity":     "qudt:numericValue",
  //   "Date/Time":    "xsd:datetime",
  //   "Label":        "rdfs:label",
  //   "Descriptive":  "rdfs:description",
  //   "URI":          "xsd:anyURI",
  // };
  // 
  var propertyTypes = {
    "anyURI":       "xsd:anyURI",
    "base64Binary": "xsd:base64Binary",
    "boolean":      "xsd:boolean",
    "date":         "xsd:date",
    "dateTime":     "xsd:dateTime",
    "float":        "xsd:float",
    "integer":      "xsd:integer",
    "string":       "xsd:string",
    "time":         "xsd:time"
  };

  
   optionsForSelect = function(a,addSel) {
     var s = '';
     if(addSel==true) {
       s='<option>select..</option>';
     }
     a.forEach(function(item) {
       s = s + "<option>" + item + '</option>'
     });
     return s;
   }
   
   addHtml = function(a,ts, i) {
     if( a.length < 25 ) {
       $('#'+ts).parent()
            .html( $('<select id="' + ts + '" name="tag_select[' + i + ']"></select>')
                    .append(
                      optionsForSelect(a)
                    )
                  );
     } else {
       $('#'+ts).parent()
            .html( $('<input></input>')
                     .attr({type : 'text', size: '14', id: ts, name: "tag_select[" + i + "]", placeholder: 'layertag'})
                     .autocomplete({ source: a })
                  );
     }
   }
   
  
   tagsForLayer = function(l,ts, i) {
    if ( availableTags[l] != null ) {
      addHtml(availableTags[l],ts, i)
      return;
    }
    
    $.ajax({
      url: '/get_layer_keys/' + l,
      type: 'get',
      success: function(data){
        obj = $.parseJSON(data)
        availableTags[l] = obj[0]["keys_for_layer"]
        addHtml(availableTags[l],ts, i)
      }
    });  
  }
  
  
  newTagSelect = function(layers) {
    
    var index = '' + $("#tagselectlist").children().length 

    var ls = $(layers).attr('name', 'layer_select[' + index + ']').change(function() {
      tagsForLayer( $(this).val(), 'tag_sel_' + index, index )
    })

    var ts = $('<input></input>').attr({type : 'text', size: '14', id: 'tag_sel_' + index, name: 'tag_select[' + index + ']', placeholder: 'layertag'}).autocomplete({
          source: availableTags['osm']
        });
        
    ts = $('<span></span>').append(ts)

    var vs = $('<input></input>').attr({type : 'text', size: '14', name: 'tag_value[' + index + ']', placeholder: 'anything'});
    
    var li = $('<li></li>').append(ls)
    li.append('&nbsp;')
    li.append('&nbsp;')
    li.append(ts).wrap('<p>')
    li.append('&nbsp;=&nbsp;')
    li.append(vs)
    li.append('&nbsp;&nbsp;')

    $("#tagselectlist").append(li)
  }
		
	function addParameter(url,key,value) {
	  var a = url.split('?')
	  if(a.length>1)
	    return url + "&" + key + "=" + value;
	  else
	    return url + "?" + key + "=" + value;
	}

	function layerSelect(e) {
	  document.location = '/layers?category=' + e.value; 
	}


	function delUrl(url,params,upd) {
	  var r=confirm("Are your sure your want to delete this layer? The layer and *all* associated data will be lost...")
	  if (r==true) {
	    var nu = url;
      
      $('#delurl').html('<img height="18" width="18" src="/css/img/progress.gif">'); 
      
      if(params) {
  	    $.each(params, function(index, value) {
  	      nu = addParameter(nu,index,value);
  	    }); 
      }
    
	    $.ajax({
	      url: nu,
	      type: 'delete',
	      success: function(data){
	        $(upd).html(data);
	      }
	    });  
	  }
	}



	function csvUpload(l,u) {
	  var data = new FormData();     
	  jQuery.each($("input[type='file']")[0].files, function(i, file) {
	      data.append(i, file);
	  });
	  $.ajax({
	      type: 'post',
	      data: data,
	      url: '/layer/' + l + '/loadcsv',
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(data){
	        $(u).html(data)
	      },
	      error: function(jqXHR,textStatus,errorThrown ){
	        $(u).html(errorThrown + '<br/>' + jqXHR.responseText)
	      }
	  });
	}

  var saveLayerProperties = function(layerid) {

    if( $.selectedField != undefined )
      loadFieldDef($.selectedField)
      
    $.post( "/layer/" + layerid + "/ldprops", 
            JSON.stringify($.layerProperties),  
            function(data, textStatus, jqXHR) {
              $("#was_saved").show()
              setTimeout(function(){$("#was_saved").hide()},2000);
            }
          )
  }
  
  var loadFieldDef = function(field) {
    
    if( $.selectedField != undefined ) {
      
      if(! $.layerProperties[$.selectedField] ) 
        $.layerProperties[$.selectedField] = {};
      
      $.layerProperties[$.selectedField].descr = $("#relation_desc").val()
      $.layerProperties[$.selectedField].type  = $("#relation_type").val()
      $.layerProperties[$.selectedField].lang  = $("#relation_lang").val()
      $.layerProperties[$.selectedField].unit  = $("#relation_unit").val()
    }

    $("#pname").html(field)
    
    if($.layerProperties[field] != undefined) {
      $("#relation_desc").val($.layerProperties[field].descr)
      $("#relation_type").val($.layerProperties[field].type)
      $("#ptype").val($.layerProperties[field].type.substring(4))
      $("#relation_lang").val($.layerProperties[field].lang)
      $("#relation_unit").val($.layerProperties[field].unit)
    } else {
      $("#relation_desc").val('')
      $("#relation_type").val('xsd:string')
      $("#ptype").val('string')
      $("#relation_lang").val('@en')
      $("#relation_unit").val('Count')
    }
    $.selectedField = field;
    
    if( $.layerProperties[field].type == 'xsd:integer' || $.layerProperties[field].type == 'xsd:float') {
      $("#relationunit").show()
      $('#relation_unit').autocomplete({ source: 
        function( request, response ) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
          response ( $.grep( $.units, function( item ) { return matcher.test( item ); } ) );
        }       
      })
    } else {
      $("#relationunit").hide()
    }

    if( $.layerProperties[field].type == 'xsd:string' || $.layerProperties[field].type == 'string') {
      $("#relationlang").show()
    } else {
      $("#relationlang").hide()
    }
  }
  
  selectFieldType = function(s) {
    
    field = $("#pname").val();

    if( $.layerProperties[field] && $.layerProperties[field].type && $.layerProperties[field].type != '')
      $("#relation_type").val($.layerProperties[field].type)
    else
      $("#relation_type").val(propertyTypes[s])

    if(s == 'integer' || s == 'float' ) {
      $("#relationunit").show()
      $('#relation_unit').autocomplete({ source: 
        function( request, response ) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
          response ( $.grep( $.units, function( item ) { return matcher.test( item ); } ) );
        }       
      })
    } else {
      $("#relationunit").hide()
    }
   
    if(s=='string') {
      $("#relationlang").show()
    } else {
      $("#relationlang").hide()
    }
 }
  
  selectFieldTags = function(layer,fieldselect) {
    if ( availableTags[layer] != null ) {
      $('#ldmap')
           .prepend( $('<select id="' + fieldselect + '" name="field" onchange="loadFieldDef(this.value)"></select>')
                         .append(  optionsForSelect(availableTags[layer],false) )
                   );
      $("#pname").html(availableTags[layer][0])
      loadFieldDef(availableTags[layer][0])
      return;
    }
    
    $.ajax({
      url: '/get_layer_keys/' + layer,
      type: 'get',
      success: function(data){
        obj = $.parseJSON(data)
        availableTags[layer] = obj[0]["keys_for_layer"]
        return selectFieldTags(layer,fieldselect)
      }
    });  
    
  }
  

  
  
  